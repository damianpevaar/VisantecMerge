import { VisitorDocumentType } from '../../enums/visitor-document-type';
import { VisitorEntryMode } from '../../enums/visitor-entry-mode';
import { VisitorRegistrationStatus } from '../../enums/visitor-registration-status';
import { VisitorTimeSlot } from '../../enums/visitor-time-slot';

interface VisitorRegistrationCommand {
    documentType: VisitorDocumentType;
    documentNumber: string;
    fullName: string;
    hostName?: string | null;
    company?: string | null;
    email?: string | null;
    phoneNumber?: string | null;
    entryMode: VisitorEntryMode;
    timeSlot?: VisitorTimeSlot | null;
    visitStart?: string | null;
    visitEnd?: string | null;
    licensePlate?: string | null;
    notes?: string | null;
    status: VisitorRegistrationStatus;
}

export type CreateVisitorRegistrationInput = VisitorRegistrationCommand;
export type UpdateVisitorRegistrationInput = VisitorRegistrationCommand;
