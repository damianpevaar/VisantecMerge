import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormArray, FormControl } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RolesService } from '../../core/services/roles-service';
import { TicketGraphqlService } from '../../core/services/ticket-graphql.service';
import { AngularMaterialModule } from '../../shared/modules/angular-material/angular-material-module';
import { Subject, takeUntil, forkJoin, take } from 'rxjs';
import { ClientRolesService, CreateClientRoleRequest } from '../../core/services/client-roles.service';
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

  rolesList: any[] = []; // 👈 lista para el dropdown de roles base
  form: FormGroup;
  clientSearch = new FormControl('');
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private _rolesService: RolesService,
    private _ticketGraphql: TicketGraphqlService,
    private _snackBar: MatSnackBar,
    private _clientRoles: ClientRolesService
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

          // Cargar también roles de cliente desde el backend
          const clientRolesCalls = this.clients.map(c =>
            this._clientRoles.getRolesByClient(c.id).pipe(take(1))
          );

          if (clientRolesCalls.length === 0) {
            this.roles = baseRoles;
            this.rolesList = [...baseRoles];
            this.loading = false;
            return;
          }

          forkJoin(clientRolesCalls).subscribe({
            next: (clientRolesResults: any[][]) => {
              const clientRoles = clientRolesResults.flat().map(r => ({
                id: r.id,
                name: r.name,
                isClientRole: true,
                clients: [
                  {
                    id: r.clientOrganizationId,
                    name:
                      this.clients.find(c => c.id === r.clientOrganizationId)?.name ??
                      '(sin nombre)'
                  }
                ]
              }));

              // Combinar roles base + client roles
              this.roles = [...baseRoles, ...clientRoles];
              this.rolesList = [...baseRoles]; // dropdown solo roles base
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
    const index = arr.value.indexOf(clientId);
    if (index === -1) arr.push(this.fb.control(clientId));
    else arr.removeAt(index);
  }

  isClientSelected(clientId: string): boolean {
    return this.clientsArray.value.includes(clientId);
  }

  selectRole(role: RoleItem): void {
    this.selectedRole = role;
    this.form.patchValue({
      roleName: role.name,
      // try to map existing role to a base role id if names match
      baseRole: this.rolesList.find(r => r.name === role.name)?.id || ''
    });
    this.clientsArray.clear();

    const clients = role.clients ?? [];
    clients.forEach(c => this.clientsArray.push(this.fb.control(c.id)));
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

    // call backend for each selected client and add created roles to UI
    const calls = selectedClients.map((clientId: string) => {
      const baseRoleId = values.baseRole || null;
      const baseRoleName = baseRoleId ? (this.rolesList.find(r => r.id === baseRoleId)?.name ?? null) : null;
      const payload: CreateClientRoleRequest = {
        clientOrganizationId: clientId,
        name: values.roleName,
        RoleId: baseRoleId ?? null,
        baseRoleName: baseRoleName ?? null,
        description: null
      };
      return this._clientRoles.createClientRole(payload);
    });

    // indicate saving state on the form
    this.form.disable();

    forkJoin(calls).pipe(take(1)).subscribe({
      next: (results: any[]) => {
        // results may be one or many created ClientRoleResponse objects
        results.forEach(res => {
          const added: RoleItem = { id: res.id ?? res.id?.toString(), name: res.name, clients: [{ id: res.clientOrganizationId ?? res.clientOrganizationId?.toString(), name: this.clients.find(c => c.id === (res.clientOrganizationId ?? res.clientOrganizationId?.toString()))?.name ?? '' }] };
          this.roles = [added, ...this.roles];
        });
        this._snackBar.open('Rol(es) creado(s) correctamente', 'Cerrar', { duration: 3000 });
        // select the first created role
        if (results.length) {
          const first = results[0];
          this.selectRole({ id: first.id ?? first.id?.toString(), name: first.name, clients: [{ id: first.clientOrganizationId ?? first.clientOrganizationId?.toString(), name: this.clients.find(c => c.id === (first.clientOrganizationId ?? first.clientOrganizationId?.toString()))?.name ?? '' }] });
        }
      },
      error: (err) => {
        console.error('Error creating client role(s)', err);
        this._snackBar.open('Error creando rol(es): ' + (err?.message ?? ''), 'Cerrar', { duration: 5000 });
      },
      complete: () => {
        this.form.enable();
      }
    });
  }

  deleteRole(role: RoleItem): void {
    this.roles = this.roles.filter(r => r.id !== role.id);
    if (this.selectedRole?.id === role.id) {
      this.selectedRole = null;
      this.form.reset();
      this.clientsArray.clear();
    }
    this._snackBar.open('Rol eliminado (simulado)', 'Cerrar', { duration: 3000 });
  }
}
