import { Injectable } from '@angular/core';
import { Apollo, QueryRef } from 'apollo-angular';
import { map, Observable } from 'rxjs';
import { VISITOR_REGISTRATION_BY_ID_QUERY, VISITOR_REGISTRATIONS_QUERY } from '../graphQL/visitor-registration-queries';
import { PrepareVariables } from '../graphQL/graph-ql.utils';
import { VisitorRegistration } from '../domain/visitor-registrations/visitor-registration';
import { VisitorRegistrationListFilters } from '../domain/visitor-registrations/visitor-registration-filters';
import { getVisitorDocumentTypeValue } from '../enums/visitor-document-type';
import { getVisitorEntryModeCode, getVisitorEntryModeValue } from '../enums/visitor-entry-mode';
import { getVisitorRegistrationStatusCode, getVisitorRegistrationStatusValue } from '../enums/visitor-registration-status';
import { getVisitorTimeSlotCode, getVisitorTimeSlotValue } from '../enums/visitor-time-slot';

type RawVisitorRegistration = Omit<VisitorRegistration, 'documentType' | 'entryMode' | 'timeSlot' | 'status'> & {
    documentType: string | number;
    entryMode: string | number;
    timeSlot?: string | number | null;
    status: string | number;
};

interface GraphQLPage<T> {
    nodes: T[];
    totalCount: number;
    pageInfo?: {
        hasNextPage: boolean;
        endCursor?: string;
    };
}

interface VisitorRegistrationsResponse {
    visitorRegistrations: GraphQLPage<RawVisitorRegistration>;
}

interface VisitorRegistrationByIdResponse {
    visitorRegistrationById: RawVisitorRegistration | null;
}

@Injectable({ providedIn: 'root' })
export class VisitorRegistrationGraphqlService {

    constructor(private readonly _apollo: Apollo) { }

    createVariables(filters: VisitorRegistrationListFilters, first: number = 50) {
        return PrepareVariables({
            first,
            after: null,
            order: [{ created: 'DESC' }],
            where: this.buildFilter(filters)
        });
    }

    watchVisitorRegistrations(filters: VisitorRegistrationListFilters, first: number = 50): QueryRef<VisitorRegistrationsResponse> {
        return this._apollo.watchQuery<VisitorRegistrationsResponse>({
            query: VISITOR_REGISTRATIONS_QUERY,
            variables: this.createVariables(filters, first)
        });
    }

    getVisitorRegistrationById(id: string): Observable<VisitorRegistration | null> {
        return this._apollo.query<VisitorRegistrationByIdResponse>({
            query: VISITOR_REGISTRATION_BY_ID_QUERY,
            variables: { id }
        })
            .pipe(map(result => {
                const registration = result.data?.visitorRegistrationById ?? null;
                return registration ? this.normalizeRegistration(registration) : null;
            }));
    }

    normalizeRegistration(registration: RawVisitorRegistration): VisitorRegistration {
        return {
            ...registration,
            documentType: getVisitorDocumentTypeValue(registration.documentType as unknown as string),
            entryMode: getVisitorEntryModeValue(registration.entryMode as unknown as string),
            timeSlot: getVisitorTimeSlotValue(registration.timeSlot as unknown as string),
            status: getVisitorRegistrationStatusValue(registration.status as unknown as string)
        };
    }

    private buildFilter(filters: VisitorRegistrationListFilters): any {
        const where: any = {};

        if (filters.status != null) {
            const status = getVisitorRegistrationStatusCode(filters.status);
            if (status) {
                where.status = { eq: status };
            }
        }

        if (filters.entryMode != null) {
            const mode = getVisitorEntryModeCode(filters.entryMode);
            if (mode) {
                where.entryMode = { eq: mode };
            }
        }

        if (filters.from || filters.to) {
            where.visitStart = {};
            if (filters.from) {
                where.visitStart.gte = this.toIso(filters.from, false);
            }
            if (filters.to) {
                where.visitStart.lte = this.toIso(filters.to, true);
            }
        }

        if (filters.searchBy && filters.searchTerm) {
            where[filters.searchBy] = { contains: filters.searchTerm };
        }

        return where;
    }

    private toIso(value: string, endOfDay: boolean): string {
        const date = new Date(value);
        if (endOfDay) {
            date.setHours(23, 59, 59, 999);
        }
        return date.toISOString();
    }
}
