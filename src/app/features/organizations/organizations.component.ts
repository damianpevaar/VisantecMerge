import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject, takeUntil } from 'rxjs';
import { ClientOrganization } from '../../core/domain/tickets/client-organization';
import { TicketGraphqlService } from '../../core/services/ticket-graphql.service';
import { ClientOrganizationService, UpsertOrganizationInput } from '../../core/services/client-organization.service';
import { AngularMaterialModule } from '../../shared/modules/angular-material/angular-material-module';

@Component({
    selector: 'app-organizations',
    imports: [CommonModule, ReactiveFormsModule, AngularMaterialModule],
    templateUrl: './organizations.component.html',
    styleUrl: './organizations.component.scss'
})
export class OrganizationsComponent implements OnInit, OnDestroy {

    private readonly _fb = inject(FormBuilder);
    private readonly _ticketGraphql = inject(TicketGraphqlService);
    private readonly _organizationService = inject(ClientOrganizationService);
    private readonly _snackBar = inject(MatSnackBar);

    organizations: ClientOrganization[] = [];
    selectedOrganization: ClientOrganization | null = null;
    loading = true;
    saving = false;

    readonly form = this._fb.group({
        name: ['', Validators.required],
        taxId: [''],
        contactEmail: ['', Validators.email],
        contactPhone: [''],
        isActive: [true]
    });

    private readonly destroy$ = new Subject<void>();
    private organizationsQuery = this._ticketGraphql.watchClientOrganizations(100);

    ngOnInit(): void {
        this.organizationsQuery
            .valueChanges
            .pipe(takeUntil(this.destroy$))
            .subscribe(({ data, loading }) => {
                this.loading = loading;
                this.organizations = data?.clientOrganizations?.nodes ?? [];
                if (!this.selectedOrganization && this.organizations.length) {
                    this.selectOrganization(this.organizations[0]);
                }
            });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    selectOrganization(organization: ClientOrganization): void {
        this.selectedOrganization = organization;
        this.form.reset({
            name: organization.name,
            taxId: organization.taxId ?? '',
            contactEmail: organization.contactEmail ?? '',
            contactPhone: organization.contactPhone ?? '',
            isActive: organization.isActive
        });
    }

    startCreate(): void {
        this.selectedOrganization = null;
        this.form.reset({
            name: '',
            taxId: '',
            contactEmail: '',
            contactPhone: '',
            isActive: true
        });
    }

    private valueOrNull(value?: string | null): string | null {
        const trimmed = (value ?? '').trim();
        return trimmed.length ? trimmed : null;
    }

    save(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        const payload: UpsertOrganizationInput = {
            name: (this.form.value.name ?? '').trim(),
            taxId: this.valueOrNull(this.form.value.taxId),
            contactEmail: this.valueOrNull(this.form.value.contactEmail),
            contactPhone: this.valueOrNull(this.form.value.contactPhone),
            isActive: this.form.value.isActive ?? true
        };

        this.saving = true;
        const request = this.selectedOrganization
            ? this._organizationService.updateOrganization(this.selectedOrganization.id, payload)
            : this._organizationService.createOrganization(payload);

        request
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: organization => {
                    this._snackBar.open('Organizacion guardada', 'Cerrar', { duration: 3000 });
                    this.selectOrganization(organization);
                    this.organizationsQuery.refetch();
                },
                error: () => this._snackBar.open('No se pudo guardar la organizacion', 'Cerrar', { duration: 4000 })
            })
            .add(() => this.saving = false);
    }
}