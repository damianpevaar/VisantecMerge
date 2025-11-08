export enum VisitorRegistrationStatus {
    Scheduled = 0,
    CheckedIn = 1,
    CheckedOut = 2,
    Cancelled = 3
}

export const VISITOR_REGISTRATION_STATUS_LABELS: Record<VisitorRegistrationStatus, string> = {
    [VisitorRegistrationStatus.Scheduled]: 'Programado',
    [VisitorRegistrationStatus.CheckedIn]: 'En ingreso',
    [VisitorRegistrationStatus.CheckedOut]: 'Finalizado',
    [VisitorRegistrationStatus.Cancelled]: 'Cancelado'
};

export const VISITOR_REGISTRATION_STATUS_OPTIONS: VisitorRegistrationStatus[] = Object
    .values(VisitorRegistrationStatus)
    .filter((value): value is VisitorRegistrationStatus => typeof value === 'number');

const VISITOR_REGISTRATION_STATUS_BACKEND_MAP: Record<string, VisitorRegistrationStatus> = {
    SCHEDULED: VisitorRegistrationStatus.Scheduled,
    CHECKED_IN: VisitorRegistrationStatus.CheckedIn,
    CHECKED_OUT: VisitorRegistrationStatus.CheckedOut,
    CANCELLED: VisitorRegistrationStatus.Cancelled
};

const VISITOR_REGISTRATION_STATUS_NUMBER_BACKEND_MAP: Record<number, string> = {
    [VisitorRegistrationStatus.Scheduled]: 'SCHEDULED',
    [VisitorRegistrationStatus.CheckedIn]: 'CHECKED_IN',
    [VisitorRegistrationStatus.CheckedOut]: 'CHECKED_OUT',
    [VisitorRegistrationStatus.Cancelled]: 'CANCELLED'
};

export function getVisitorRegistrationStatusValue(value: string | number | null | undefined): VisitorRegistrationStatus {
    if (value == null) {
        return VisitorRegistrationStatus.Scheduled;
    }
    if (typeof value === 'number') {
        return value as VisitorRegistrationStatus;
    }
    return VISITOR_REGISTRATION_STATUS_BACKEND_MAP[value] ?? VisitorRegistrationStatus.Scheduled;
}

export function getVisitorRegistrationStatusCode(value: VisitorRegistrationStatus | null | undefined): string | undefined {
    if (value == null) {
        return undefined;
    }
    return VISITOR_REGISTRATION_STATUS_NUMBER_BACKEND_MAP[value];
}
