import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { AngularMaterialModule } from '../../shared/modules/angular-material/angular-material-module';
import { TicketReportService } from '../../core/services/ticket-report.service';
import { TicketReportSummary } from '../../core/domain/tickets/ticket-report-summary';
import { TicketGraphqlService } from '../../core/services/ticket-graphql.service';
import { Ticket } from '../../core/domain/tickets/ticket';
import { getStatusValue, getStatusLowerValue, TICKET_STATUS_LABELS } from '../../core/enums/ticket-status';
import { getPriorityValue, TICKET_PRIORITY_LABELS } from '../../core/enums/ticket-priority';
import { TicketOrigin, TICKET_ORIGIN_LABELS } from '../../core/enums/ticket-origin';

@Component({
    selector: 'app-dashboard',
    imports: [CommonModule, AngularMaterialModule, DatePipe, DecimalPipe],
    templateUrl: './dashboard.component.html',
    styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit, OnDestroy {

    summary: TicketReportSummary = {
        totalTickets: 0,
        overdueTickets: 0,
        ticketsByStatus: [],
        ticketsByOrigin: [],
        ticketsByAssignee: [],
        ticketsByClient: []
    };

    overdueTickets: Ticket[] = [];
    loadingSummary = true;
    loadingOverdue = true;

    private readonly destroy$ = new Subject<void>();

    constructor(
        private readonly _reportService: TicketReportService,
        private readonly _ticketGraphql: TicketGraphqlService
    ) { }

    ngOnInit(): void {
        this._reportService
            .watchSummary({})
            .valueChanges
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: ({ data, loading }) => {
                    this.loadingSummary = loading;
                    if (data?.ticketSummary) {
                        this.summary = data.ticketSummary;
                    }
                },
                error: (err) => {
                    this.loadingSummary = false;
                    console.error('Error loading ticket summary:', err);
                }
            });

        this._ticketGraphql
            .watchOverdueTickets(10)
            .valueChanges
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: ({ data, loading }) => {
                    this.loadingOverdue = loading;
                    if (data?.overdueTickets?.nodes) {
                        this.overdueTickets = data.overdueTickets.nodes;
                    }
                },
                error: (err) => {
                    this.loadingOverdue = false;
                    console.error('Error loading overdue tickets:', err);
                }
            });
    } 

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    statusLabel(status: string | number): string {
        const value = getStatusValue(status);
        return TICKET_STATUS_LABELS[value] ?? status;
    }

    statusLowLabel(status: string | number): string {
        const value = getStatusLowerValue(status);
        return TICKET_STATUS_LABELS[value] ?? status;
    }

    priorityLabel(priority: string | number): string {
        const value = getPriorityValue(priority);
        return TICKET_PRIORITY_LABELS[value] ?? priority;
    }

    originLabel(code: string): string {
        return TICKET_ORIGIN_LABELS[code as TicketOrigin] ?? code;
    }
}
