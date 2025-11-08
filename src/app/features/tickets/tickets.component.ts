import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { QueryRef } from 'apollo-angular';
import { Subject, debounceTime, switchMap, takeUntil } from 'rxjs';
import { Ticket } from '../../core/domain/tickets/ticket';
import { TicketAttachment } from '../../core/domain/tickets/ticket-attachment';
import { ClientOrganization } from '../../core/domain/tickets/client-organization';
import { ManagedMailbox } from '../../core/domain/tickets/managed-mailbox';
import { TicketListFilters } from '../../core/domain/tickets/ticket-filters';
import { CreateTicketInput, ReplyToTicketInput, UpdateTicketInput } from '../../core/domain/tickets/ticket-commands';
import { IUser } from '../../core/domain/iuser';
import { TicketPriority, TICKET_PRIORITY_LABELS, TICKET_PRIORITY_OPTIONS, getPriorityNumValue } from '../../core/enums/ticket-priority';
import { TicketOrigin, TICKET_ORIGIN_LABELS, TICKET_ORIGIN_OPTIONS, getOriginValue } from '../../core/enums/ticket-origin';
import { TicketStatus, TICKET_STATUS_LABELS, TICKET_STATUS_OPTIONS, getStatusNumValue } from '../../core/enums/ticket-status';
import { downloadFromBase64 } from '../../core/utils/file-utils';
import { TicketCommandService } from '../../core/services/ticket-command.service';
import { TicketGraphqlService } from '../../core/services/ticket-graphql.service';
import { UserDirectoryService } from '../../core/services/user-directory.service';
import { AngularMaterialModule } from '../../shared/modules/angular-material/angular-material-module';
import { TicketCreateDialogComponent, TicketCreateDialogData } from './components/ticket-create-dialog.component';
import { TicketReplyFormComponent } from './components/ticket-reply-form.component';

@Component({
    selector: 'app-tickets',
    imports: [CommonModule, ReactiveFormsModule, AngularMaterialModule, DatePipe, TicketReplyFormComponent],
    templateUrl: './tickets.component.html',
    styleUrl: './tickets.component.scss'
})
export class TicketsComponent implements OnInit, OnDestroy {

    private readonly _fb = inject(FormBuilder);
    private readonly _dialog = inject(MatDialog);
    private readonly _snackBar = inject(MatSnackBar);
    private readonly _ticketGraphql = inject(TicketGraphqlService);
    private readonly _ticketCommands = inject(TicketCommandService);
    private readonly _userDirectory = inject(UserDirectoryService);

    readonly statusOptions = TICKET_STATUS_OPTIONS;
    readonly statusLabels = TICKET_STATUS_LABELS;
    readonly priorityOptions = TICKET_PRIORITY_OPTIONS;
    readonly priorityLabels = TICKET_PRIORITY_LABELS;
    readonly originOptions = TICKET_ORIGIN_OPTIONS;
    readonly originLabels = TICKET_ORIGIN_LABELS;

    readonly filtersForm = this._fb.group({
        search: [''],
        status: [null as TicketStatus | null],
        priority: [null as TicketPriority | null],
        origin: [null as TicketOrigin | null],
        clientOrganizationId: [null as string | null],
        assignedToUserId: [null as string | null],
        from: [null as string | null],
        to: [null as string | null]
    });

    readonly updateForm = this._fb.group({
        subject: ['', [Validators.required, Validators.minLength(3)]],
        description: [''],
        priority: [TicketPriority.Medium, Validators.required],
        status: [TicketStatus.InProgress, Validators.required],
        clientOrganizationId: [null as string | null],
        resolutionSummary: ['']
    });

    readonly assignControl = new FormControl<string | null>(null);

    tickets: Ticket[] = [];
    selectedTicket: Ticket | null = null;

    organizations: ClientOrganization[] = [];
    mailboxes: ManagedMailbox[] = [];
    assignableUsers: IUser[] = [];

    loadingTickets = true;
    loadingDetail = false;
    updatingTicket = false;
    replying = false;

    private ticketsQuery?: QueryRef<any>;
    private readonly destroy$ = new Subject<void>();

    ngOnInit(): void {
        this.initializeFilters();
        this.loadTickets();
        this.loadCatalogs();
        this.setupAssignableUsersLookup();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    trackByTicketId(_: number, ticket: Ticket): string {
        return ticket.id;
    }

    selectTicket(ticket: Ticket): void {
        if (!ticket) {
            return;
        }

        this.selectedTicket = ticket;
        this.updateForm.patchValue({
            subject: ticket.subject,
            description: ticket.description ?? '',
            priority: ticket.priority,
            status: ticket.status,
            clientOrganizationId: ticket.clientOrganizationId ?? null,
            resolutionSummary: ticket.resolutionSummary ?? ''
        });
        this.assignControl.setValue(ticket.assignedToUserId ?? null, { emitEvent: false });
    }

    openCreateDialog(): void {
        const dialogRef = this._dialog.open<TicketCreateDialogComponent, TicketCreateDialogData, CreateTicketInput>(
            TicketCreateDialogComponent,
            {
                width: '640px',
                data: {
                    organizations: this.organizations
                }
            }
        );

        dialogRef.afterClosed()
            .pipe(takeUntil(this.destroy$))
            .subscribe(payload => {
                if (payload) {
                    this.createTicket(payload);
                }
            });
    }

    submitUpdate(): void {
        if (!this.selectedTicket || this.updateForm.invalid) {
            this.updateForm.markAllAsTouched();
            return;
        }

        const payload: UpdateTicketInput = {
            subject: this.updateForm.value.subject ?? this.selectedTicket.subject,
            description: this.updateForm.value.description ?? this.selectedTicket.description ?? '',
            priority: this.updateForm.value.priority ?? this.selectedTicket.priority,
            status: this.updateForm.value.status ?? this.selectedTicket.status,
            clientOrganizationId: this.updateForm.value.clientOrganizationId ?? null,
            resolutionSummary: this.updateForm.value.resolutionSummary ?? null
        };

        this.updatingTicket = true;
        this._ticketCommands.updateTicket(this.selectedTicket.id, payload)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: () => {
                    this._snackBar.open('Ticket actualizado correctamente', 'Cerrar', { duration: 3000 });
                    this.refreshTickets();
                },
                error: () => {
                    this._snackBar.open('No se pudo actualizar el ticket', 'Cerrar', { duration: 4000 });
                }
            })
            .add(() => this.updatingTicket = false);
    }

    assignTicket(): void {
        if (!this.selectedTicket) {
            return;
        }

        const assignedToUserId = this.assignControl.value;
        if (!assignedToUserId) {
            return;
        }

        this._ticketCommands.assignTicket(this.selectedTicket.id, { assignedToUserId })
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: () => {
                    this._snackBar.open('Ticket asignado correctamente', 'Cerrar', { duration: 3000 });
                    this.refreshTickets();
                },
                error: () => {
                    this._snackBar.open('No se pudo asignar el ticket', 'Cerrar', { duration: 4000 });
                }
            });
    }

    handleReply(event: ReplyToTicketInput): void {
        if (!this.selectedTicket) {
            return;
        }

        this.replying = true;
        this._ticketCommands.replyToTicket(this.selectedTicket.id, event)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: () => {
                    this._snackBar.open('Respuesta enviada', 'Cerrar', { duration: 3000 });
                    if (this.selectedTicket) {
                        this.refreshTicketDetail(this.selectedTicket.id);
                    }
                },
                error: () => {
                    this._snackBar.open('No se pudo enviar la respuesta', 'Cerrar', { duration: 4000 });
                }
            })
            .add(() => this.replying = false);
    }

    deleteTicket(ticket: Ticket): void {
        if (!ticket) {
            return;
        }

        if (!window.confirm(`Deseas eliminar el ticket ${ticket.ticketNumber}?`)) {
            return;
        }

        this._ticketCommands.deleteTicket(ticket.id)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: () => {
                    this._snackBar.open('Ticket eliminado', 'Cerrar', { duration: 3000 });
                    if (this.selectedTicket?.id === ticket.id) {
                        this.selectedTicket = null;
                    }
                    this.refreshTickets();
                },
                error: () => {
                    this._snackBar.open('No se pudo eliminar el ticket', 'Cerrar', { duration: 4000 });
                }
            });
    }

    downloadAttachment(attachment: TicketAttachment): void {
        if (attachment.content) {
            downloadFromBase64(attachment.fileName, attachment.content, attachment.contentType);
        } else {
            this._snackBar.open('El adjunto no esta disponible para descarga directa.', 'Cerrar', { duration: 4000 });
        }
    }

    statusChip(ticket: Ticket): string {
        return this.statusLabels[ticket.status] ?? ticket.status;
    }

    priorityChip(ticket: Ticket): string {
        return this.priorityLabels[ticket.priority] ?? ticket.priority;
    }

    originChip(ticket: Ticket): string {
        return this.originLabels[ticket.origin] ?? ticket.origin;
    }

    private initializeFilters(): void {
        this.filtersForm.valueChanges
            .pipe(debounceTime(250), takeUntil(this.destroy$))
            .subscribe(() => this.refreshTickets());
    }

    private loadTickets(): void {
        const query = this._ticketGraphql.watchTickets(this.getCurrentFilters());
        this.ticketsQuery = query;

        query.valueChanges
            .pipe(takeUntil(this.destroy$))
            .subscribe(({ data, loading }) => {
                this.loadingTickets = loading;
                const nodes = data?.tickets?.nodes ?? [];
                this.tickets = nodes;

                if (!this.selectedTicket && nodes.length) {
                    this.selectTicket(nodes[0]);
                } else if (this.selectedTicket) {
                    const updated = nodes.find((t: Ticket) => t.id === this.selectedTicket?.id);
                    if (updated) {
                        this.selectTicket(updated);
                    }
                }
            });
    }
<<<<<<< HEAD
=======
    
>>>>>>> develop
    private refreshTickets(): void {
        const query = this.ticketsQuery;
        if (!query) {
            this.loadTickets();
            return;
        }

        const filters = this.getCurrentFilters();
        query.refetch({
            first: 50,
            after: null,
            order: [{ openedAt: 'DESC' }],
            where: this.buildFilterPayload(filters)
        });
    }

    private refreshTicketDetail(id: string): void {
        this.loadingDetail = true;
        this._ticketGraphql.getTicketById(id)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: ticket => {
                    if (ticket) {
                        this.selectTicket(ticket);
                    }
                },
                error: () => {
                    this._snackBar.open('No se pudo recargar el ticket', 'Cerrar', { duration: 4000 });
                }
            })
            .add(() => this.loadingDetail = false);
    }

    private getCurrentFilters(): TicketListFilters {
        const value = this.filtersForm.value;
        return {
            search: value.search ?? undefined,
            status: getStatusNumValue(value.status) ?? undefined,
            priority: getPriorityNumValue(value.priority) ?? undefined,
            origin: getOriginValue(value.origin) ?? undefined,
            clientOrganizationId: value.clientOrganizationId ?? undefined,
            assignedToUserId: value.assignedToUserId ?? undefined,
            from: value.from ?? undefined,
            to: value.to ?? undefined
        };
    }

    private buildFilterPayload(filters: TicketListFilters): any {
        const where: any = {};

        if (filters.status) {
            where.status = { eq: filters.status };
        }

        if (filters.priority) {
            where.priority = { eq: filters.priority };
        }

        if (filters.origin) {
            where.origin = { eq: filters.origin };
        }

        if (filters.clientOrganizationId) {
            where.clientOrganizationId = { eq: filters.clientOrganizationId };
        }

        if (filters.assignedToUserId) {
            where.assignedToUserId = { eq: filters.assignedToUserId };
        }

        if (filters.from || filters.to) {
            where.openedAt = {};
            if (filters.from) {
                filters.from = filters.from + "T00:00:00Z";
                where.openedAt.gte = filters.from;
            }
            if (filters.to) {
                filters.to = filters.to + "T23:59:59Z";
                where.openedAt.lte = filters.to;
            }
        }

        if (filters.search) {
            const contains = { contains: filters.search };
            where.or = [
                { subject: contains },
                { description: contains },
                { ticketNumber: contains },
                { requestedByEmail: contains },
                { requestedByName: contains }
            ];
        }

        return where;
    }

    private loadCatalogs(): void {
        this._ticketGraphql.watchClientOrganizations(100)
            .valueChanges
            .pipe(takeUntil(this.destroy$))
            .subscribe(({ data }) => {
                this.organizations = data?.clientOrganizations?.nodes ?? [];
            });

        this._ticketGraphql.watchManagedMailboxes()
            .valueChanges
            .pipe(takeUntil(this.destroy$))
            .subscribe(({ data }) => {
                this.mailboxes = data?.managedMailboxes?.nodes ?? [];
            });
    }

    private setupAssignableUsersLookup(): void {
        this.assignControl.valueChanges
            .pipe(
                debounceTime(300),
                takeUntil(this.destroy$),
                switchMap(value => this._userDirectory.searchUsers(value ?? ''))
            )
            .subscribe(users => this.assignableUsers = users);

        // this._userDirectory.searchUsers('')
        //     .pipe(takeUntil(this.destroy$))
        //     .subscribe(users => this.assignableUsers = users);
    }

    private createTicket(payload: CreateTicketInput): void {
        this._ticketCommands.createTicket(payload)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: () => {
                    this._snackBar.open('Ticket creado', 'Cerrar', { duration: 3000 });
                    this.refreshTickets();
                },
                error: () => this._snackBar.open('No se pudo crear el ticket', 'Cerrar', { duration: 4000 })
            });
    }
}
