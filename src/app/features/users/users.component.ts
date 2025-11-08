import { Component, OnDestroy, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UsersService } from '../../core/services/users/users-service';
import { UserRegisterService, RegisterUserInput } from '../../core/services/users/user-register.service';
import { UserRolesService } from '../../core/services/users/user-roles.service';
import { IUser } from '../../core/domain/iuser';
import { AngularMaterialModule } from '../../shared/modules/angular-material/angular-material-module';
import { debounceTime, Subject, takeUntil, switchMap } from 'rxjs';
import { QueryRef } from 'apollo-angular';
import { GetUsersVariables } from '../../core/graphQL/user-queries';
import { IGetUsersResponse } from '../../core/domain/users/iget-users-response';
import { RolesService } from '../../core/services/roles-service';

@Component({
  selector: 'app-users-component',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AngularMaterialModule],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss']
})
export class UsersComponent implements OnInit, OnDestroy {

  users: IUser[] = [];
  rolesList: Array<{ id: string; name: string; normalizedName?: string }> = [];
  selectedUser: IUser | null = null;
  loading = true;
  saving = false;

  form: FormGroup;
  passwordVisible = false;

  private filters: GetUsersVariables = {
    where: {},
    after: null,
    first: 25,
    order: null
  };

  private queryRef!: QueryRef<IGetUsersResponse, GetUsersVariables>;
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private _usersService: UsersService,
    private _userRegister: UserRegisterService,
    private _snackBar: MatSnackBar,
    private _rolesService: RolesService,
    private _userRolesService: UserRolesService,
    private cdr: ChangeDetectorRef
  ) {
    this.form = this.fb.group({
      userName: [''],
      email: ['', Validators.email],
      role: [''],
      isActive: [true],
      password: ['']
    });

    // initialize queryRef and subscribe
    this.queryRef = this._usersService.getUsers(this.filters);
    this.queryRef.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(result => {
      this.loading = !!result.loading;
      this.users = result.data?.users?.nodes ?? [];
    });

    // load roles for the role dropdown
    this._rolesService.getRoles().pipe(takeUntil(this.destroy$)).subscribe(list => {
      this.rolesList = list;
    });
  }

  ngOnInit(): void { }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  startCreate(): void {
    this.selectedUser = null;
    this.form.reset({ userName: '', email: '', role: '', isActive: true, password: '' });

    const pwdValidators = [
      Validators.required,
      Validators.minLength(8),
      Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,}$/)
    ];
    this.form.get('password')!.setValidators(pwdValidators);
    this.form.get('password')!.updateValueAndValidity();
  }

  selectUser(user: IUser): void {
    this.selectedUser = user;

    // Extrae el primer rol del arreglo (si existe)
    const userRole = user.roles && user.roles.length > 0 ? user.roles[0] : '';

    this.form.patchValue({
      userName: user.userName,
      email: user.email,
      role: userRole, // ahora el mat-select mostrará este valor
      isActive: (user as any).status?.isActive ?? user.isActive ?? false
    });

    this.form.get('password')!.setValue('');
    this.form.get('password')!.clearValidators();
    this.form.get('password')!.updateValueAndValidity();

    this.cdr.detectChanges();
  }

  get passwordControl() {
    return this.form.get('password');
  }

  private pwdValue(): string {
    return this.passwordControl?.value ?? '';
  }

  get pwdHasUpper(): boolean { return /[A-Z]/.test(this.pwdValue()); }
  get pwdHasLower(): boolean { return /[a-z]/.test(this.pwdValue()); }
  get pwdHasNumber(): boolean { return /\d/.test(this.pwdValue()); }
  get pwdHasSymbol(): boolean { return /[^\w\s]/.test(this.pwdValue()); }
  get pwdMinLen(): boolean { return (this.pwdValue().length >= 8); }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving = true;
    const values = this.form.value;

    let request$;

    if (this.selectedUser) {
      const updateInput: any = {
        userName: values.userName,
        email: values.email,
        phoneNumber: (this.selectedUser as any).phoneNumber ?? null,
        isActive: values.isActive
      };

      if (values.password) updateInput.password = values.password;

      request$ = this._usersService.updateUser(this.selectedUser.id, updateInput);
    } else {
      const payload: RegisterUserInput = {
        userName: values.userName,
        email: values.email,
        roles: [],
        password: values.password,
        isActive: values.isActive ?? true
      };
      request$ = this._userRegister.registerUser(payload);
    }

    request$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
          next: (user) => {
            this._snackBar.open('Usuario guardado', 'Cerrar', { duration: 3000 });
            // capture currently selected role BEFORE we replace the form values with the server response
            const selectedRoleBefore = this.form.get('role')?.value;

            this.upsertLocalUser(user);
            // select the returned user in the form
            this.selectUser(user);
            this.queryRef.refetch();

            // also update roles on the backend using email (backend expects UserName)
            this.updateUserRole(selectedRoleBefore);
          },
        error: (err) => {
          console.error('Error saving user', err);
          this._snackBar.open('No se pudo guardar el usuario', 'Cerrar', { duration: 4000 });
        }
      })
      .add(() => this.saving = false);
  }

  // actualiza el estado (isActive) automáticamente al cambiar el toggle
  onStatusToggle(isActive: boolean): void {
    if (!this.selectedUser) return;

    this.saving = true;
    this._usersService.updateStatus(this.selectedUser.id, isActive)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this._snackBar.open(
            `Estado actualizado a ${isActive ? 'Activo' : 'Inactivo'}`,
            'Cerrar',
            { duration: 3000 }
          );
          this.form.get('isActive')?.setValue(isActive, { emitEvent: false });
        },
        error: (err) => {
          console.error('Error actualizando estado', err);
          this._snackBar.open('Error al actualizar el estado', 'Cerrar', { duration: 4000 });
          // revertir el cambio si falló
          this.form.get('isActive')?.setValue(!isActive, { emitEvent: false });
        }
      })
      .add(() => this.saving = false);
  }

  // Actualiza el rol del usuario actual usando UserRolesService
  updateUserRole(role?: string): void {
    if (!this.selectedUser) return;

    const selectedRole = role ?? this.form.get('role')?.value;
    if (!selectedRole) {
      this._snackBar.open('Selecciona un rol para asignar', 'Cerrar', { duration: 3000 });
      return;
    }

    this.saving = true;

    this._userRolesService.updateUserRoles({
      userName: this.selectedUser.email, // backend expects UserName but we use email
      roles: [selectedRole]
    })
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (res) => {
        this._snackBar.open(res.message || 'Rol actualizado correctamente', 'Cerrar', { duration: 3000 });
      },
      error: (err) => {
        console.error('Error actualizando rol', err);
        this._snackBar.open('No se pudo actualizar el rol', 'Cerrar', { duration: 4000 });
      }
    })
    .add(() => this.saving = false);
  }

  private upsertLocalUser(user: IUser): void {
    const index = this.users.findIndex(existing => existing.id === user.id);
    if (index > -1) {
      this.users = this.users.map(existing => existing.id === user.id ? user : existing);
    } else {
      this.users = [user, ...this.users];
    }
  }
}
