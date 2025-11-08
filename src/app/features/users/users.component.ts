import { Apollo } from 'apollo-angular';
import { Component, OnDestroy, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UsersService } from '../../core/services/users/users-service';
import { UserStatusService } from '../../core/services/users/user-status.service';
import { UserRegisterService, RegisterUserInput } from '../../core/services/users/user-register.service';
import { UserRolesService } from '../../core/services/users/user-roles.service';
import { IUser } from '../../core/domain/iuser';
import { AngularMaterialModule } from '../../shared/modules/angular-material/angular-material-module';
import { Subject, takeUntil, take } from 'rxjs';
import { TicketGraphqlService } from '../../core/services/ticket-graphql.service';
import { QueryRef } from 'apollo-angular';
import { GetUsersVariables } from '../../core/graphQL/user-queries';
import { IGetUsersResponse } from '../../core/domain/users/iget-users-response';
import { RolesService } from '../../core/services/roles/roles-service';
import { RolesFacadeService, RoleOption as FacadeRoleOption } from '../../core/services/roles/roles-facade.service';
import { passwordValidators, passwordCriteria } from '../../core/validators/password-validators';
import { UserClientRolesService } from '../../core/services/user-client-roles.service';

type RoleOption = {
  id: string;
  name: string;
  normalizedName?: string;
  type?: 'base' | 'client';
};

@Component({
  selector: 'app-users-component',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AngularMaterialModule],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss']
})
export class UsersComponent implements OnInit, OnDestroy {

  users: IUser[] = [];
  rolesList: RoleOption[] = [];
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
    private _userClientRolesService: UserClientRolesService,
    private fb: FormBuilder,
    private _usersService: UsersService,
    private _userRegister: UserRegisterService,
    private _userStatusService: UserStatusService,
    private _snackBar: MatSnackBar,
    private _rolesService: RolesService,
    private _rolesFacade: RolesFacadeService,
    private _userRolesService: UserRolesService,
    private _ticketGraphql: TicketGraphqlService,
    private apollo: Apollo,
    private cdr: ChangeDetectorRef
  ) {
    this.form = this.fb.group({
      userName: [''],
      email: ['', [Validators.required, Validators.email]],
      role: [''],
      isActive: [true],
      password: ['']
    });

    this.queryRef = this._usersService.getUsers(this.filters);
    this.queryRef.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(result => {
      this.loading = !!result.loading;
      this.users = result.data?.users?.nodes ?? [];
    });

    this.loadRoles();
  }

  ngOnInit(): void {}
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadRoles(): void {
    this._rolesFacade.getCombinedRoles(100).pipe(takeUntil(this.destroy$)).subscribe(list => {
      this.rolesList = (list || []) as RoleOption[];
    });
  }

  startCreate(): void {
    this.selectedUser = null;
    this.form.reset({
      userName: '',
      email: '',
      role: '',
      isActive: true,
      password: ''
    });

    this.form.get('password')!.setValidators(passwordValidators);
    this.form.get('password')!.updateValueAndValidity();
  }

  selectUser(user: IUser): void {
    if (!user) return;
    this.selectedUser = user;

    const userRoleName = user.roles && user.roles.length > 0 ? user.roles[0] : '';
    const baseRole = this.rolesList.find(r => r.name === userRoleName && r.type === 'base');

    this.form.patchValue({
      userName: user.userName,
      email: user.email,
      role: baseRole ? baseRole.id : '',
      isActive: user.status?.isActive ?? user.isActive ?? false
    });

    this.form.get('password')?.setValue('');
    this.form.get('password')?.clearValidators();
    this.form.get('password')?.updateValueAndValidity();

    this._userClientRolesService.getAllUserClientRoles(100).pipe(take(1)).subscribe(nodes => {
      const userClientRole = (nodes || []).find((n: any) => n.userId === user.id);
      if (userClientRole) {
        const matchingRole = this.rolesList.find(r => r.id === userClientRole.clientRoleId);
        if (matchingRole) this.form.patchValue({ role: matchingRole.id });
      }
    });

    this.cdr.detectChanges();
  }

  get passwordControl() {
    return this.form.get('password');
  }

  private pwdValue(): string {
    return this.passwordControl?.value ?? '';
  }

  get pwdCriteria() {
    return passwordCriteria(this.pwdValue());
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

  this.saving = true;
  const values = this.form.value;
  const isCreating = !this.selectedUser;
  let request$;

    if (this.selectedUser) {
      const current = this.selectedUser;
      const currentIsActive = (current as any).status?.isActive ?? current.isActive ?? false;
      const changes = {
        nameChanged: values.userName !== current.userName,
        emailChanged: values.email !== current.email,
        activeChanged: values.isActive !== currentIsActive,
        passwordProvided: !!values.password
      };

      const needsUpdate = Object.values(changes).some(Boolean);
      if (!needsUpdate) {
        this.updateUserRole(values.role);
        this.saving = false;
        return;
      }

      const updateInput: any = {
        userName: values.userName,
        email: values.email,
        phoneNumber: (current as any).phoneNumber ?? null,
        isActive: values.isActive
      };

      if (values.password) updateInput.password = values.password;
      request$ = this._usersService.updateUser(current.id, updateInput);
    } else {
      const payload: RegisterUserInput = {
        email: values.email,
        password: values.password
      };
      request$ = this._userRegister.registerUser(payload);
    }

    request$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (user) => {
          console.debug('UsersComponent.save -> registerUser next, user=', user);
          this._snackBar.open('Usuario guardado', 'Cerrar', { duration: 3000 });

          const selectedRoleBefore = this.form.get('role')?.value;

          this.selectUser(user);

          if (isCreating) {
            const emailToUse = (user && (user as any).email) || values.email;
            this._userStatusService
              .createStatus(emailToUse, values.isActive)
              .pipe(take(1))
              .subscribe({
                next: () => this.queryRef.refetch(),
                error: (err) => this._snackBar.open('No se pudo crear el estado del usuario', 'Cerrar', { duration: 4000 })
              });
          }
         this.updateUserRole(selectedRoleBefore);
        },
        error: () => {
          this._snackBar.open('No se pudo guardar el usuario', 'Cerrar', { duration: 4000 });
        }
      })
      .add(() => (this.saving = false));
  }

  onStatusToggle(isActive: boolean): void {
    if (!this.selectedUser) return;

    this.saving = true;

    this._userStatusService.updateStatus(this.selectedUser.email, isActive)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.queryRef.refetch();
          this._snackBar.open(
            `Estado actualizado a ${isActive ? 'Activo' : 'Inactivo'}`,
            'Cerrar',
            { duration: 3000 }
          );
          this.form.get('isActive')?.setValue(isActive, { emitEvent: false });
        },
        error: () => {
          this._snackBar.open('Error al actualizar el estado', 'Cerrar', { duration: 4000 });
          this.form.get('isActive')?.setValue(!isActive, { emitEvent: false });
        }
      })
      .add(() => (this.saving = false));
  }

  updateUserRole(role?: string): void {
    if (!this.selectedUser) return;

    const selectedRole = role ?? this.form.get('role')?.value;
    if (!selectedRole) {
      this._snackBar.open('Selecciona un rol para asignar', 'Cerrar', { duration: 3000 });
      return;
    }

    this.saving = true;
    const roleData = this.rolesList.find(r => r.id === selectedRole);
    const isClientRole = roleData?.type === 'client';

    if (isClientRole) {
      this._userClientRolesService
        .updateByUser(this.selectedUser.id, [roleData!.id])
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () =>{
             this._snackBar.open('Rol de cliente asignado', 'Cerrar', { duration: 3000 });
             this.queryRef.refetch();
          },
          error: () => this._snackBar.open('Error asignando rol de cliente', 'Cerrar', { duration: 4000 })
        })
        .add(() => (this.saving = false));
    } else {
      const roleNameToSend = roleData?.name ?? selectedRole;
      this._userRolesService
        .updateUserRoles({
          userName: this.selectedUser.email,
          roles: [roleNameToSend]
        })
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: res => {
            this._snackBar.open(res.message || 'Rol actualizado', 'Cerrar', { duration: 3000 });
            this.queryRef.refetch();
          },
          error: () => this._snackBar.open('No se pudo actualizar el rol', 'Cerrar', { duration: 4000 })
        })
        .add(() => (this.saving = false));
    }
  }
}
