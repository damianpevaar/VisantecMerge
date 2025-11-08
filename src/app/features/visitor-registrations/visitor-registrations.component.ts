import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { QueryRef } from 'apollo-angular';
import { Subject, takeUntil } from 'rxjs';
import { AngularMaterialModule } from '../../shared/modules/angular-material/angular-material-module';
import { VisitorRegistration } from '../../core/domain/visitor-registrations/visitor-registration';
import { VisitorRegistrationListFilters, VisitorSearchField } from '../../core/domain/visitor-registrations/visitor-registration-filters';
import { CreateVisitorRegistrationInput } from '../../core/domain/visitor-registrations/visitor-registration-commands';
import { VisitorRegistrationGraphqlService } from '../../core/services/visitor-registration-graphql.service';
import { VisitorRegistrationCommandService } from '../../core/services/visitor-registration-command.service';
import { VisitorDocumentType, VISITOR_DOCUMENT_TYPE_LABELS, VISITOR_DOCUMENT_TYPE_OPTIONS } from '../../core/enums/visitor-document-type';
import { VisitorEntryMode, VISITOR_ENTRY_MODE_LABELS, VISITOR_ENTRY_MODE_OPTIONS } from '../../core/enums/visitor-entry-mode';
import { VisitorRegistrationStatus } from '../../core/enums/visitor-registration-status';
import { VisitorTimeSlot, VISITOR_TIME_SLOT_LABELS, VISITOR_TIME_SLOT_OPTIONS } from '../../core/enums/visitor-time-slot';
import { ClientOrganization } from '../../core/domain/tickets/client-organization';
import { TicketGraphqlService } from '../../core/services/ticket-graphql.service';

interface VisitorRegistrationsQueryResponse {
    visitorRegistrations: {
        nodes: any[];
        totalCount: number;
    };
}

@Component({
    selector: 'app-visitor-registrations',
    imports: [CommonModule, ReactiveFormsModule, AngularMaterialModule],
    templateUrl: './visitor-registrations.component.html',
    styleUrl: './visitor-registrations.component.scss'
})
export class VisitorRegistrationsComponent implements OnInit, OnDestroy {

    private readonly _fb = inject(FormBuilder);
    private readonly _snackBar = inject(MatSnackBar);
    private readonly _visitorGraphql = inject(VisitorRegistrationGraphqlService);
    private readonly _visitorCommands = inject(VisitorRegistrationCommandService);
    private readonly _ticketGraphql = inject(TicketGraphqlService);

    private readonly destroy$ = new Subject<void>();
    private registrationsQuery?: QueryRef<VisitorRegistrationsQueryResponse>;
    private currentFilters: VisitorRegistrationListFilters = {};
    private readonly pageSize = 50;

    registrations: VisitorRegistration[] = [];
    totalRegistrations = 0;
    loadingRegistrations = true;
    saving = false;
    editingId: string | null = null;
    organizations: ClientOrganization[] = [];

    readonly documentTypeOptions = VISITOR_DOCUMENT_TYPE_OPTIONS;
    readonly documentTypeLabels = VISITOR_DOCUMENT_TYPE_LABELS;
    readonly entryModeOptions = VISITOR_ENTRY_MODE_OPTIONS;
    readonly entryModeLabels = VISITOR_ENTRY_MODE_LABELS;
    readonly timeSlotOptions = VISITOR_TIME_SLOT_OPTIONS;
    readonly timeSlotLabels = VISITOR_TIME_SLOT_LABELS;

    readonly searchOptions: { label: string; value: VisitorSearchField }[] = [
        { label: 'Nombres', value: 'fullName' },
        { label: 'Documento', value: 'documentNumber' },
        { label: 'Placa', value: 'licensePlate' },
        { label: 'A quien visita', value: 'hostName' },
        { label: 'Email', value: 'email' }
    ];

    private readonly nameSanitizeRegex = /[^A-Za-zÁÉÍÓÚáéíóúÑñ\s]/g;
    private readonly licensePlateSanitizeRegex = /[^A-Z0-9]/g;
    private readonly minDateTimeLocal = this.buildCurrentDateTimeLocal();

    private readonly visitRangeValidator: ValidatorFn = (group: AbstractControl): ValidationErrors | null => {
        const startControl = group.get('visitStart');
        const endControl = group.get('visitEnd');

        if (!startControl || !endControl) {
            return null;
        }

        const start = startControl.value;
        const end = endControl.value;

        if (start && end && new Date(end) < new Date(start)) {
            const errors = { ...(endControl.errors ?? {}) };
            errors['invalidRange'] = true;
            endControl.setErrors(errors);
            return { invalidRange: true };
        }

        if (endControl.hasError('invalidRange')) {
            const { invalidRange, ...rest } = endControl.errors ?? {};
            endControl.setErrors(Object.keys(rest).length ? rest : null);
        }

        return null;
    };

    readonly registrationForm = this._fb.group({
        documentType: [VisitorDocumentType.CC, Validators.required],
        documentNumber: ['', [Validators.required, Validators.minLength(4), Validators.pattern(/^\d+$/)]],
        fullName: ['', [Validators.required, Validators.minLength(3), Validators.pattern(/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/u)]],
        hostName: [''],
        company: [null as string | null],
        email: ['', Validators.email],
        phoneNumber: ['', [Validators.pattern(/^\d*$/)]],
        entryMode: [VisitorEntryMode.Pedestrian, Validators.required],
        timeSlot: [null as VisitorTimeSlot | null, Validators.required],
        visitStart: [''],
        visitEnd: [''],
        licensePlate: ['', [Validators.pattern(/^[A-Z0-9]*$/)]],
        notes: ['']
    }, { validators: this.visitRangeValidator });

    readonly filterForm = this._fb.group({
        from: [null as Date | string | null],
        to: [null as Date | string | null],
        searchBy: ['fullName' as VisitorSearchField],
        searchTerm: ['']
    });

    readonly displayedColumns = ['created', 'fullName', 'entryMode', 'hostName', 'visitStart', 'visitEnd', 'licensePlate', 'status', 'actions'];

    ngOnInit(): void {
        this.loadRegistrations();
        this.loadOrganizations();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    trackByRegistrationId(_: number, registration: VisitorRegistration): string {
        return registration.id;
    }

    submitRegistration(): void {
        if (this.registrationForm.invalid) {
            this.registrationForm.markAllAsTouched();
            return;
        }

        const payload = this.mapFormToPayload();
        const request$ = this.editingId
            ? this._visitorCommands.updateRegistration(this.editingId, payload)
            : this._visitorCommands.createRegistration(payload);

        this.saving = true;
        request$
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: () => {
                    this._snackBar.open(this.editingId ? 'Registro actualizado' : 'Registro creado', 'Cerrar', { duration: 3000 });
                    this.resetForm();
                    this.refreshRegistrations();
                },
                error: () => this._snackBar.open('No se pudo guardar el registro', 'Cerrar', { duration: 4000 })
            })
            .add(() => this.saving = false);
    }

    editRegistration(registration: VisitorRegistration): void {
        this.editingId = registration.id;
        this.registrationForm.reset({
            documentType: registration.documentType,
            documentNumber: registration.documentNumber,
            fullName: registration.fullName,
            hostName: registration.hostName ?? '',
            company: registration.company ?? null,
            email: registration.email ?? '',
            phoneNumber: registration.phoneNumber ?? '',
            entryMode: registration.entryMode,
            timeSlot: registration.timeSlot ?? null,
            visitStart: this.toDateTimeLocal(registration.visitStart),
            visitEnd: this.toDateTimeLocal(registration.visitEnd),
            licensePlate: registration.licensePlate ?? '',
            notes: registration.notes ?? ''
        });
    }

    deleteRegistration(registration: VisitorRegistration): void {
        const confirmed = window.confirm(`Eliminar el registro de ${registration.fullName}?`);
        if (!confirmed) {
            return;
        }

        this._visitorCommands.deleteRegistration(registration.id)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: () => {
                    this._snackBar.open('Registro eliminado', 'Cerrar', { duration: 3000 });
                    if (this.editingId === registration.id) {
                        this.resetForm();
                    }
                    this.refreshRegistrations();
                },
                error: () => this._snackBar.open('No se pudo eliminar el registro', 'Cerrar', { duration: 4000 })
            });
    }

    cancelEdit(): void {
        this.resetForm();
    }

    applyFilters(): void {
        this.currentFilters = this.getFilterPayload();
        this.refreshRegistrations();
    }

    clearFilters(): void {
        this.filterForm.reset({
            from: null,
            to: null,
            searchBy: 'fullName',
            searchTerm: ''
        });
        this.currentFilters = {};
        this.refreshRegistrations();
    }

    setEntryMode(mode: VisitorEntryMode): void {
        this.registrationForm.patchValue({ entryMode: mode });
    }

    entryModeChecked(mode: VisitorEntryMode): boolean {
        return this.registrationForm.value.entryMode === mode;
    }

    get minVisitStart(): string {
        const currentValue = this.registrationForm.value.visitStart;
        if (currentValue && currentValue < this.minDateTimeLocal) {
            return currentValue;
        }
        return this.minDateTimeLocal;
    }

    get minVisitEnd(): string {
        const startValue = this.registrationForm.value.visitStart;
        if (startValue) {
            return startValue;
        }
        return this.minVisitStart;
    }

    get visitRangeInvalid(): boolean {
        const control = this.registrationForm.get('visitEnd');
        return !!control && control.hasError('invalidRange');
    }

    handleNumericInput(controlName: 'documentNumber' | 'phoneNumber', event: Event): void {
        const input = event.target as HTMLInputElement;
        const sanitized = input.value.replace(/\D+/g, '');
        if (sanitized !== input.value) {
            this.registrationForm.get(controlName)?.setValue(sanitized, { emitEvent: false });
        }
    }

    handleNameInput(event: Event): void {
        const input = event.target as HTMLInputElement;
        const sanitized = input.value.replace(this.nameSanitizeRegex, '');
        if (sanitized !== input.value) {
            this.registrationForm.get('fullName')?.setValue(sanitized, { emitEvent: false });
        }
    }

    handleLicensePlateInput(event: Event): void {
        const input = event.target as HTMLInputElement;
        const sanitized = input.value.toUpperCase().replace(this.licensePlateSanitizeRegex, '');
        if (sanitized !== input.value) {
            this.registrationForm.get('licensePlate')?.setValue(sanitized, { emitEvent: false });
        }
    }

    async exportToExcel(): Promise<void> {
        if (!this.registrations.length) {
            this._snackBar.open('No hay registros para exportar', 'Cerrar', { duration: 3000 });
            return;
        }

        try {
            const [{ Workbook }, fileSaver] = await Promise.all([
                import('exceljs'),
                import('file-saver')
            ]);
            const workbook = new Workbook();
            const worksheet = workbook.addWorksheet('Historial de visitas');

            worksheet.columns = [
                { header: 'Fecha registro', key: 'created', width: 22 },
                { header: 'Nombre', key: 'fullName', width: 26 },
                { header: 'Modo ingreso', key: 'entryMode', width: 18 },
                { header: 'A quien visita', key: 'host', width: 24 },
                { header: 'Fecha inicial', key: 'visitStart', width: 22 },
                { header: 'Fecha final', key: 'visitEnd', width: 22 },
                { header: 'Placa', key: 'licensePlate', width: 14 },
                { header: 'Estado', key: 'status', width: 16 }
            ];

            this.registrations.forEach(registration => {
                const timeline = this.getTimelineStatus(registration);
                worksheet.addRow({
                    created: this.formatDate(registration.created),
                    fullName: registration.fullName,
                    entryMode: this.entryModeChip(registration.entryMode),
                    host: registration.hostName ?? 'Sin asignar',
                    visitStart: registration.visitStart ? this.formatDate(registration.visitStart) : 'Sin definir',
                    visitEnd: registration.visitEnd ? this.formatDate(registration.visitEnd) : 'Sin definir',
                    licensePlate: registration.licensePlate ?? 'N/A',
                    status: timeline.label
                });
            });

            worksheet.getRow(1).eachCell(cell => {
                cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
                cell.alignment = { horizontal: 'center', vertical: 'middle' };
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FF2563EB' }
                };
            });

            worksheet.eachRow((row, rowNumber) => {
                if (rowNumber === 1) {
                    return;
                }
                if (rowNumber % 2 === 0) {
                    row.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FFF1F5F9' }
                    };
                }
                row.alignment = { vertical: 'middle' };
            });

            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            });
            fileSaver.saveAs(blob, `visitas-${new Date().toISOString().slice(0, 10)}.xlsx`);
            this._snackBar.open('Exportación a Excel generada', 'Cerrar', { duration: 2500 });
        } catch (error) {
            console.error(error);
            this._snackBar.open('No se pudo generar el Excel', 'Cerrar', { duration: 4000 });
        }
    }

    async exportToPdf(): Promise<void> {
        if (!this.registrations.length) {
            this._snackBar.open('No hay registros para exportar', 'Cerrar', { duration: 3000 });
            return;
        }

        try {
            const [jsPDFModule, autoTableModule] = await Promise.all([
                import('jspdf'),
                import('jspdf-autotable')
            ]);
            const doc = new jsPDFModule.default({ orientation: 'landscape' });
            doc.setFontSize(16);
            doc.text('Historial de visitas', 14, 18);

            const body = this.registrations.map(registration => {
                const timeline = this.getTimelineStatus(registration);
                return [
                    this.formatDate(registration.created),
                    registration.fullName,
                    this.entryModeChip(registration.entryMode),
                    registration.hostName ?? 'Sin asignar',
                    registration.visitStart ? this.formatDate(registration.visitStart) : 'Sin definir',
                    registration.visitEnd ? this.formatDate(registration.visitEnd) : 'Sin definir',
                    registration.licensePlate ?? 'N/A',
                    timeline.label
                ];
            });

            const autoTable = autoTableModule.default;
            autoTable(doc, {
                startY: 24,
                head: [[
                    'Fecha registro',
                    'Nombre',
                    'Modo ingreso',
                    'A quien visita',
                    'Fecha inicial',
                    'Fecha final',
                    'Placa',
                    'Estado'
                ]],
                body,
                theme: 'grid',
                headStyles: { fillColor: [37, 99, 235], textColor: 255 },
                alternateRowStyles: { fillColor: [241, 245, 249] },
                styles: { fontSize: 10, cellPadding: 4 }
            });

            doc.save(`visitas-${new Date().toISOString().slice(0, 10)}.pdf`);
            this._snackBar.open('Exportación a PDF generada', 'Cerrar', { duration: 2500 });
        } catch (error) {
            console.error(error);
            this._snackBar.open('No se pudo generar el PDF', 'Cerrar', { duration: 4000 });
        }
    }

    documentTypeChip(value: VisitorDocumentType): string {
        return this.documentTypeLabels[value] ?? String(value);
    }

    entryModeChip(value: VisitorEntryMode): string {
        return this.entryModeLabels[value] ?? String(value);
    }

    getTimelineStatus(registration: VisitorRegistration): { label: string; cssClass: 'scheduled' | 'active' | 'inactive' } {
        const now = new Date();
        const start = this.parseDate(registration.visitStart);
        const end = this.parseDate(registration.visitEnd);

        if (start && now < start) {
            return { label: 'Programado', cssClass: 'scheduled' };
        }

        if (start && end && now >= start && now <= end) {
            return { label: 'Activo', cssClass: 'active' };
        }

        if (end && now > end) {
            return { label: 'Inactivo', cssClass: 'inactive' };
        }

        if (!start && !end) {
            return { label: 'Programado', cssClass: 'scheduled' };
        }

        if (start && !end) {
            return now >= start
                ? { label: 'Activo', cssClass: 'active' }
                : { label: 'Programado', cssClass: 'scheduled' };
        }

        return { label: 'Inactivo', cssClass: 'inactive' };
    }

    timeSlotChip(value: VisitorTimeSlot | null | undefined): string {
        if (value == null) {
            return 'Sin horario';
        }
        return this.timeSlotLabels[value] ?? String(value);
    }

    companyExists(name: string | null | undefined): boolean {
        if (!name) {
            return false;
        }
        return this.organizations.some(org => org.name === name);
    }

    private loadRegistrations(): void {
        this.registrationsQuery = this._visitorGraphql.watchVisitorRegistrations(this.currentFilters, this.pageSize);
        this.registrationsQuery.valueChanges
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: ({ data, loading }) => {
                    this.loadingRegistrations = loading;
                    const nodes = data?.visitorRegistrations?.nodes ?? [];
                    this.registrations = nodes.map(node => this._visitorGraphql.normalizeRegistration(node));
                    this.totalRegistrations = data?.visitorRegistrations?.totalCount ?? 0;
                },
                error: () => {
                    this.loadingRegistrations = false;
                    this._snackBar.open('No se pudo cargar la lista de visitantes', 'Cerrar', { duration: 4000 });
                }
            });
    }

    private loadOrganizations(): void {
        this._ticketGraphql.watchClientOrganizations(100)
            .valueChanges
            .pipe(takeUntil(this.destroy$))
            .subscribe(({ data }) => {
                this.organizations = data?.clientOrganizations?.nodes ?? [];
            });
    }

    private refreshRegistrations(): void {
        if (!this.registrationsQuery) {
            this.loadRegistrations();
            return;
        }

        if (this.loadingRegistrations) {
            return;
        }

        this.loadingRegistrations = true;
        this.registrationsQuery.refetch(this._visitorGraphql.createVariables(this.currentFilters, this.pageSize))
            .catch(() => {
                this._snackBar.open('No se pudo actualizar la lista', 'Cerrar', { duration: 4000 });
                this.loadingRegistrations = false;
            })
            .finally(() => this.loadingRegistrations = false);
    }

    private resetForm(): void {
        this.editingId = null;
        this.registrationForm.reset({
            documentType: VisitorDocumentType.CC,
            documentNumber: '',
            fullName: '',
            hostName: '',
            company: null,
            email: '',
            phoneNumber: '',
            entryMode: VisitorEntryMode.Pedestrian,
            timeSlot: null,
            visitStart: '',
            visitEnd: '',
            licensePlate: '',
            notes: ''
        });
    }

    private getFilterPayload(): VisitorRegistrationListFilters {
        const value = this.filterForm.value;
        const filters: VisitorRegistrationListFilters = {};

        const from = this.normalizeDateFilter(value.from);
        if (from) {
            filters.from = from;
        }

        const to = this.normalizeDateFilter(value.to);
        if (to) {
            filters.to = to;
        }

        if (value.searchTerm) {
            filters.searchBy = value.searchBy ?? 'fullName';
            filters.searchTerm = value.searchTerm;
        }

        return filters;
    }

    private mapFormToPayload(): CreateVisitorRegistrationInput {
        const value = this.registrationForm.value;
        return {
            documentType: value.documentType ?? VisitorDocumentType.CC,
            documentNumber: value.documentNumber ?? '',
            fullName: value.fullName ?? '',
            hostName: this.emptyToNull(value.hostName),
            company: this.emptyToNull(value.company),
            email: this.emptyToNull(value.email),
            phoneNumber: this.emptyToNull(value.phoneNumber),
            entryMode: value.entryMode ?? VisitorEntryMode.Pedestrian,
            timeSlot: value.timeSlot ?? null,
            visitStart: this.valueToIso(value.visitStart),
            visitEnd: this.valueToIso(value.visitEnd),
            licensePlate: this.emptyToNull((value.licensePlate ?? '').toUpperCase()),
            notes: this.emptyToNull(value.notes),
            status: VisitorRegistrationStatus.Scheduled
        };
    }

    private buildCurrentDateTimeLocal(): string {
        const now = new Date();
        now.setSeconds(0, 0);
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        return now.toISOString().slice(0, 16);
    }

    private normalizeDateFilter(value: string | Date | null | undefined): string | undefined {
        if (value == null || value === '') {
            return undefined;
        }

        if (value instanceof Date) {
            if (isNaN(value.getTime())) {
                return undefined;
            }
            return value.toISOString().slice(0, 10);
        }

        return value;
    }

    private parseDate(value: string | null | undefined): Date | null {
        if (!value) {
            return null;
        }
        const date = new Date(value);
        return isNaN(date.getTime()) ? null : date;
    }

    private valueToIso(value: string | null | undefined): string | null {
        if (!value) {
            return null;
        }
        const date = new Date(value);
        return date.toISOString();
    }

    private toDateTimeLocal(value: string | null | undefined): string {
        if (!value) {
            return '';
        }
        const date = new Date(value);
        date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
        return date.toISOString().slice(0, 16);
    }

    private emptyToNull(value: string | null | undefined): string | null {
        if (value == null) {
            return null;
        }
        const trimmed = value.trim();
        return trimmed.length ? trimmed : null;
    }

    private formatDate(value: string | null | undefined): string {
        if (!value) {
            return '';
        }
        try {
            return new Date(value).toLocaleString();
        } catch {
            return value;
        }
    }
}
