import { Component, OnDestroy, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormArray, FormControl } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RolesService } from '../../core/services/roles/roles-service';
import { TicketGraphqlService } from '../../core/services/ticket-graphql.service';
import { AngularMaterialModule } from '../../shared/modules/angular-material/angular-material-module';
import { Subject, takeUntil, forkJoin, take } from 'rxjs';
import { ClientRolesService, CreateClientRoleRequest, ClientRoleResponse } from '../../core/services/client-roles.service';
import { RoleItem } from '../../core/domain/irole';
import { ClientOrganization } from '../../core/domain/tickets/client-organization';

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AngularMaterialModule],
  templateUrl: './roles.component.html',
  styleUrls: ['./roles.component.scss']
})
export class RolesComponent implements OnInit, OnDestroy {
  loading = true;
  roles: RoleItem[] = [];
  clients: ClientOrganization[] = [];
  filteredClients: ClientOrganization[] = [];
  selectedRole: RoleItem | null = null;
  rolesList: any[] = []; 
  form: FormGroup;
  clientSearch = new FormControl('');
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private _rolesService: RolesService,
    private _ticketGraphql: TicketGraphqlService,
    private _snackBar: MatSnackBar,
    private _clientRoles: ClientRolesService,
    private cdRef: ChangeDetectorRef
  ) {
    this.form = this.fb.group({
      roleName: ['', Validators.required],
      baseRole: ['', Validators.required],
      clients: this.fb.array([])
    });
  }

  ngOnInit(): void {
    const roles$ = this._rolesService.getRoles(100).pipe(take(1));
    const clients$ = this._ticketGraphql.watchClientOrganizations(100).valueChanges.pipe(take(1));

    forkJoin([roles$, clients$])
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ([rolesRes, clientsRes]: any) => {
          // Roles base (Identity)
          const baseRoles = (rolesRes || []).map((r: any) => ({
            id: r.id,
            name: r.name,
            isClientRole: false,
            clients: []
          }));

          // Clientes
          const clientNodes = clientsRes?.data?.clientOrganizations?.nodes ?? [];
          this.clients = clientNodes.map((n: any) => ({
            id: n.id,
            name: n.name,
            contactEmail: n.contactEmail,
            contactPhone: n.contactPhone
          }));
          this.filteredClients = [...this.clients];

          // Cargar roles de cliente desde backend (un único llamado GraphQL)
          this._rolesService.getClientRoles(100).pipe(take(1)).subscribe({
            next: (clientRolesNodes: any[]) => {
              const grouped: Record<string, any> = {};

              (clientRolesNodes || []).forEach(r => {
                if (!grouped[r.id]) {
                  grouped[r.id] = {
                    id: r.id,
                    name: r.name,
                    isClientRole: true,
                    baseRoleId: r.baseRoleId,
                    baseRoleName: r.baseRoleName,
                    clients: []
                  };
                }

                if (Array.isArray(r.clients)) {
                  r.clients.forEach((c: { id: string; name: string }) => {
                    const exists = grouped[r.id].clients.some((x: any) => x.id === c.id);
                    if (!exists) {
                      grouped[r.id].clients.push({ id: c.id, name: c.name });
                    }
                  });
                }
              });

              const clientRoles = Object.values(grouped);
              this.roles = [...clientRoles];
              this.rolesList = [...baseRoles];
            },
            error: (err) => {
              console.error('Error fetching client roles', err);
              this.roles = baseRoles;
            },
            complete: () => (this.loading = false)
          });
        },
        error: () => (this.loading = false)
      });

    // Filtro de búsqueda de clientes
    this.clientSearch.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(term => {
        const t = (term || '').toLowerCase();
        this.filteredClients = this.clients.filter(c =>
          c.name.toLowerCase().includes(t)
        );
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get clientsArray(): FormArray {
    return this.form.get('clients') as FormArray;
  }

  toggleClientSelection(clientId: string): void {
    const arr = this.clientsArray;
    const index = arr.value.findIndex((id: string) => id?.toLowerCase() === clientId?.toLowerCase());
    if (index === -1) {
      arr.push(this.fb.control(clientId));
    } else {
      arr.removeAt(index);
    }
  }

  isClientSelected(clientId: string): boolean {
    return this.clientsArray.value.some((id: string) =>
      (id ?? '').toString().toLowerCase() === (clientId ?? '').toString().toLowerCase()
    );
  }

  selectRole(role: RoleItem): void {
    console.log('Seleccionado:', role);
    this.selectedRole = role;

    this.clientsArray.clear();
    (role.clients ?? []).forEach(c => this.clientsArray.push(this.fb.control(c.id)));

    this.form.patchValue({
      roleName: role.name,
      baseRole: (() => {
        const bid = (role as any).baseRoleId;
        if (!bid) return '';
        const found = this.rolesList.find(r => (r.id ?? '').toString().toLowerCase() === bid.toString().toLowerCase());
        return found ? found.id : bid;
      })()
    });

    this.form.updateValueAndValidity();
    this.cdRef.detectChanges(); // asegura refresco visual
  }

  startCreate(): void {
    this.selectedRole = null;
    this.form.reset({
      roleName: '',
      baseRole: '',
      clients: []
    });
    this.clientsArray.clear();
  }

  createRole(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const values = this.form.value;
    const selectedClients: string[] = values.clients || [];

    if (!selectedClients.length) {
      this._snackBar.open('Selecciona al menos un cliente para crear el rol.', 'Cerrar', { duration: 3000 });
      return;
    }

    const baseRoleId = values.baseRole || null;
    const baseRoleName = baseRoleId
      ? (this.rolesList.find(r => r.id === baseRoleId)?.name ?? null)
      : null;

    const payload: CreateClientRoleRequest = {
      clientOrganizationIds: selectedClients,
      name: values.roleName,
      baseRoleId,
      baseRoleName,
      description: null
    };

    this.form.disable();

    this._clientRoles.createClientRole(payload).pipe(take(1)).subscribe({
      next: (res: ClientRoleResponse) => {
        const added: RoleItem = {
          id: res.id,
          name: res.name,
          isClientRole: true,
          baseRoleId: res.baseRoleId,
          baseRoleName: res.baseRoleName,
          clients: res.clients.map(c => ({
            id: c.id,
            name: c.name
          }))
        };

        this.roles = [added, ...this.roles];
        this._snackBar.open('Rol creado correctamente', 'Cerrar', { duration: 3000 });
      },
      error: (err) => {
        console.error('Error creating client role', err);
        this._snackBar.open('Error creando rol: ' + (err?.message ?? ''), 'Cerrar', { duration: 5000 });
      },
      complete: () => this.form.enable()
    });
  }

  updateRole(): void {
    if (!this.selectedRole) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const values = this.form.value;
    const selectedClients: string[] = values.clients || [];

    if (!selectedClients.length) {
      this._snackBar.open('Selecciona al menos un cliente.', 'Cerrar', { duration: 3000 });
      return;
    }

    const baseRoleId = values.baseRole || null;
    const baseRoleName = baseRoleId
      ? (this.rolesList.find(r => r.id === baseRoleId)?.name ?? null)
      : null;

    const payload: CreateClientRoleRequest = {
      clientOrganizationIds: selectedClients,
      name: values.roleName,
      baseRoleId,
      baseRoleName,
      description: null
    };

    this.form.disable();

    this._clientRoles.updateClientRole(this.selectedRole.id, payload).pipe(take(1)).subscribe({
      next: (res) => {
        // actualiza localmente la lista de roles
        const idx = this.roles.findIndex(r => r.id === this.selectedRole?.id);
        if (idx !== -1) {
          this.roles[idx] = {
            ...this.roles[idx],
            name: res.name,
            baseRoleId: res.baseRoleId,
            baseRoleName: res.baseRoleName,
            clients: res.clients
          };
        }

        this.selectedRole = { ...this.selectedRole, ...res };
        this._snackBar.open('Rol actualizado correctamente', 'Cerrar', { duration: 3000 });
      },
      error: (err) => {
        console.error('Error actualizando rol', err);
        this._snackBar.open('Error actualizando el rol', 'Cerrar', { duration: 4000 });
      },
      complete: () => this.form.enable()
    });
  }

  deleteRole(role: RoleItem): void {
    if (!role || !role.id) {
      this._snackBar.open('No se puede eliminar el rol: ID inválido', 'Cerrar', { duration: 3000 });
      return;
    }

    const confirmDelete = confirm(`¿Seguro que deseas eliminar el rol "${role.name}"?`);
    if (!confirmDelete) return;

    this._clientRoles.deleteClientRole(role.id).pipe(take(1)).subscribe({
      next: () => {
        // elimina localmente el rol de la lista
        this.roles = this.roles.filter(r => r.id !== role.id);

        // limpia el formulario si el rol eliminado estaba seleccionado
        if (this.selectedRole?.id === role.id) {
          this.selectedRole = null;
          this.form.reset();
          this.clientsArray.clear();
        }

        this._snackBar.open('Rol eliminado correctamente', 'Cerrar', { duration: 3000 });
      },
      error: (err) => {
        console.error('Error eliminando rol:', err);
        this._snackBar.open('Error eliminando el rol', 'Cerrar', { duration: 4000 });
      }
    });
  }
}
