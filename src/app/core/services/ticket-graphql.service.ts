import { Injectable } from '@angular/core';
import { Apollo, QueryRef } from 'apollo-angular';
import { map, Observable } from 'rxjs';
import { TICKETS_QUERY, TICKET_BY_ID_QUERY, OVERDUE_TICKETS_QUERY } from '../graphQL/ticket-queries';
import { CLIENT_ORGANIZATIONS_QUERY } from '../graphQL/organization-queries';
import { MANAGED_MAILBOXES_QUERY } from '../graphQL/mailbox-queries';
import { Ticket } from '../domain/tickets/ticket';
import { TicketListFilters } from '../domain/tickets/ticket-filters';
import { PrepareVariables } from '../graphQL/graph-ql.utils';
import { ClientOrganization } from '../domain/tickets/client-organization';
import { ManagedMailbox } from '../domain/tickets/managed-mailbox';

interface GraphQLPage<T> {
    nodes: T[];
    totalCount: number;
    pageInfo?: {
        hasNextPage: boolean;
        endCursor?: string;
    };
}

interface TicketsResponse {
    tickets: GraphQLPage<Ticket>;
}

interface TicketByIdResponse {
    ticketByIdAsync: Ticket | null;
}

interface OverdueTicketsResponse {
    overdueTickets: GraphQLPage<Ticket>;
}

interface ClientOrganizationsResponse {
    clientOrganizations: GraphQLPage<ClientOrganization>;
}

interface ManagedMailboxesResponse {
    managedMailboxes: GraphQLPage<ManagedMailbox>;
}

@Injectable({ providedIn: 'root' })
export class TicketGraphqlService {

    constructor(private readonly _apollo: Apollo) { }

    watchTickets(filters: TicketListFilters, first: number = 50): QueryRef<TicketsResponse> {
        const variables = PrepareVariables({
            first,
            after: null,
            order: [{ openedAt: 'DESC' }],
            where: this.buildTicketFilter(filters)
        });

        return this._apollo.watchQuery<TicketsResponse>({
            query: TICKETS_QUERY,
            variables
        });
    }

    getTicketById(id: string): Observable<Ticket | null> {
        return this._apollo
            .query<TicketByIdResponse>({
                query: TICKET_BY_ID_QUERY,
                variables: { id }
            })
            .pipe(map(result => result.data.ticketByIdAsync ?? null));
    }

    watchOverdueTickets(first: number = 25): QueryRef<OverdueTicketsResponse> {
        return this._apollo.watchQuery<OverdueTicketsResponse>({
            query: OVERDUE_TICKETS_QUERY,
            variables: { first }
        });
    }

    watchClientOrganizations(first: number = 100): QueryRef<ClientOrganizationsResponse> {
        return this._apollo.watchQuery<ClientOrganizationsResponse>({
            query: CLIENT_ORGANIZATIONS_QUERY,
            variables: { first, after: null, where: {} },
            fetchPolicy: 'cache-and-network'
        });
    }

    watchManagedMailboxes(): QueryRef<ManagedMailboxesResponse> {
        return this._apollo.watchQuery<ManagedMailboxesResponse>({
            query: MANAGED_MAILBOXES_QUERY,
            fetchPolicy: 'cache-and-network'
        });
    }

    private buildTicketFilter(filters: TicketListFilters): any {
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
                where.openedAt.gte = filters.from;
            }
            if (filters.to) {
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
}
