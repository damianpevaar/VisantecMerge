import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { Subject, debounceTime, takeUntil } from 'rxjs';
import { ClientOrganization } from '../../core/domain/tickets/client-organization';
import { TicketReportFilter } from '../../core/domain/tickets/ticket-report-filter';
import { TicketReportSummary } from '../../core/domain/tickets/ticket-report-summary';
import { IUser } from '../../core/domain/iuser';
import { TicketOrigin, TICKET_ORIGIN_LABELS, TICKET_ORIGIN_OPTIONS, getOriginValue } from '../../core/enums/ticket-origin';
import { TicketStatus, TICKET_STATUS_LABELS, TICKET_STATUS_OPTIONS, getStatusNumValue } from '../../core/enums/ticket-status';
import { getStatusLowerValue } from '../../core/enums/ticket-status';
import { TicketGraphqlService } from '../../core/services/ticket-graphql.service';
import { TicketReportService } from '../../core/services/ticket-report.service';
import { UserDirectoryService } from '../../core/services/user-directory.service';
import { AngularMaterialModule } from '../../shared/modules/angular-material/angular-material-module';


@Component({
    selector: 'app-reports',
    imports: [CommonModule, ReactiveFormsModule, AngularMaterialModule, MatTableModule],
    templateUrl: './reports.component.html',
    styleUrl: './reports.component.scss'
})
export class ReportsComponent implements OnInit, OnDestroy {

    private readonly _fb = inject(FormBuilder);
    private readonly _reportService = inject(TicketReportService);
    private readonly _ticketGraphql = inject(TicketGraphqlService);
    private readonly _userDirectory = inject(UserDirectoryService);

    readonly statusOptions = TICKET_STATUS_OPTIONS;
    readonly statusLabels = TICKET_STATUS_LABELS;
    readonly originOptions = TICKET_ORIGIN_OPTIONS;
    readonly originLabels = TICKET_ORIGIN_LABELS;

    summary: TicketReportSummary | null = null;
    loading = true;

    organizations: ClientOrganization[] = [];
    users: IUser[] = [];

    readonly filtersForm = this._fb.group({
        from: [null as string | null],
        to: [null as string | null],
        status: [null as TicketStatus | null],
        origin: [null as TicketOrigin | null],
        clientOrganizationId: [null as string | null],
        assignedToUserId: [null as string | null]
    });

    private readonly destroy$ = new Subject<void>();

    ngOnInit(): void {
        this.loadCatalogs();
        this.filtersForm.valueChanges
            .pipe(debounceTime(200), takeUntil(this.destroy$))
            .subscribe(() => this.loadSummary());

        this.loadSummary();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    private loadSummary(): void {
        this.loading = true;
        const filter = this.buildFilter();
        this._reportService.getSummary(filter)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: summary => this.summary = summary,
                error: () => this.summary = {
                    totalTickets: 0,
                    overdueTickets: 0,
                    ticketsByStatus: [],
                    ticketsByOrigin: [],
                    ticketsByAssignee: [],
                    ticketsByClient: []
                }
            })
            .add(() => this.loading = false);
    }

    private buildFilter(): TicketReportFilter {
        const value = this.filtersForm.value;
        return {
            from: value.from ?? "",
            to: value.to ?? "",
            status: getStatusNumValue(value.status) ?? null,
            origin: getOriginValue(value.origin) ?? null,
            clientOrganizationId: value.clientOrganizationId ?? "",
            assignedToUserId: value.assignedToUserId ?? ""
        };
    }

    statusLabel(status: string | number): string {
        const value = getStatusLowerValue(status);
        return TICKET_STATUS_LABELS[value] ?? status;
    }

    originLabel(code: string): string {
        return this.originLabels[code as TicketOrigin] ?? code;
    }

    private loadCatalogs(): void {
        this._ticketGraphql.watchClientOrganizations(100)
            .valueChanges
            .pipe(takeUntil(this.destroy$))
            .subscribe(({ data }) => {
                this.organizations = data?.clientOrganizations?.nodes ?? [];
            });

        // this._userDirectory.searchUsers('')
        //     .pipe(takeUntil(this.destroy$))
        //     .subscribe(users => this.users = users);
    }

    entries(dictionary: Record<string, number>): Array<{ key: string; value: number }> {
        return Object.entries(dictionary).map(([key, value]) => ({ key, value }));
    }
}