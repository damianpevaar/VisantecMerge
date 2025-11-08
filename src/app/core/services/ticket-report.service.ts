import { Injectable } from '@angular/core';
import { Apollo, QueryRef } from 'apollo-angular';
import { map, Observable } from 'rxjs';
import { TICKET_SUMMARY_QUERY } from '../graphQL/ticket-report.query';
import { TicketReportSummary } from '../domain/tickets/ticket-report-summary';
import { TicketReportFilter } from '../domain/tickets/ticket-report-filter';

interface TicketSummaryResponse {
    ticketSummary: TicketReportSummary;
}

@Injectable({ providedIn: 'root' })
export class TicketReportService {

    constructor(private readonly _apollo: Apollo) { }

    watchSummary(filter: TicketReportFilter): QueryRef<TicketSummaryResponse> {
        return this._apollo.watchQuery<TicketSummaryResponse>({
            query: TICKET_SUMMARY_QUERY,
            variables: { filter: this.stripNulls(filter) },
            fetchPolicy: 'cache-and-network'
        });
    }

    getSummary(filter: TicketReportFilter): Observable<TicketReportSummary> {
        const query = TICKET_SUMMARY_QUERY;
        return this._apollo.query<TicketSummaryResponse>({
            query: TICKET_SUMMARY_QUERY,
            variables: { filter: this.stripNulls(filter) }
        }).pipe(map(result => result.data.ticketSummary));
    }

    private stripNulls(filter: TicketReportFilter): TicketReportFilter {
        const cleaned: TicketReportFilter = {};
        Object.entries(filter).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                (cleaned as any)[key] = value;
            }
        });
        return cleaned;
    }
}
