import { VisitorEntryMode } from '../../enums/visitor-entry-mode';
import { VisitorRegistrationStatus } from '../../enums/visitor-registration-status';

export type VisitorSearchField = 'fullName' | 'documentNumber' | 'licensePlate' | 'hostName' | 'email';

export interface VisitorRegistrationListFilters {
    from?: string;
    to?: string;
    searchBy?: VisitorSearchField;
    searchTerm?: string;
    status?: VisitorRegistrationStatus;
    entryMode?: VisitorEntryMode;
}
