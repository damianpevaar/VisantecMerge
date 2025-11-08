export enum TicketStatus {
    Received = 0,
    InProgress = 1,
    AwaitingApproval = 2,
    Approved = 3,
    Rejected = 4,
    Closed = 5
}

export const TICKET_STATUS_LABELS: Record<TicketStatus, string> = {
    [TicketStatus.Received]: 'Recibido',
    [TicketStatus.InProgress]: 'En progreso',
    [TicketStatus.AwaitingApproval]: 'En espera de aprobación',
    [TicketStatus.Approved]: 'Aprobado',
    [TicketStatus.Rejected]: 'Rechazado',
    [TicketStatus.Closed]: 'Cerrado'
};

export const TICKET_STATUS_OPTIONS: TicketStatus[] = Object
  .values(TicketStatus)
  .filter((v): v is TicketStatus => typeof v === 'number');

// Mapeo auxiliar para los strings del backend
export const TICKET_STATUS_BACKEND_MAP: Record<string, TicketStatus> = {
    RECEIVED: TicketStatus.Received,
    IN_PROGRESS: TicketStatus.InProgress,
    AWAITING_APPROVAL: TicketStatus.AwaitingApproval,
    APPROVED: TicketStatus.Approved,
    REJECTED: TicketStatus.Rejected,
    CLOSED: TicketStatus.Closed
};

// Mapeo auxiliar para los strings del backend
export const TICKET_STATUS_LOWER_BACKEND_MAP: Record<string, TicketStatus> = {
    Received: TicketStatus.Received,
    InProgress: TicketStatus.InProgress,
    AwaitingApproval: TicketStatus.AwaitingApproval,
    Approved: TicketStatus.Approved,
    Rejected: TicketStatus.Rejected,
    Closed: TicketStatus.Closed
};

export const TICKET_STATUS_NUMBER_BACKEND_MAP: Record<number, string> = {
    0: 'RECEIVED',
    1: 'IN_PROGRESS',
    2: 'AWAITING_APPROVAL',
    3: 'APPROVED',
    4: 'REJECTED',
    5: 'CLOSED'
};

export function getStatusValue(value: string | number): TicketStatus {
    if (typeof value === 'string') {
        return TICKET_STATUS_BACKEND_MAP[value] ?? TicketStatus.Received;
    }
    return value as TicketStatus;
}

export function getStatusNumValue(value: string | number | undefined | null): string | undefined {
    if (value == null) return undefined;
    if (typeof value === 'number') {
        return TICKET_STATUS_NUMBER_BACKEND_MAP[value];
    }
    return undefined;
}

export function getStatusLowerValue(value: string | number): TicketStatus {
    if (typeof value === 'string') {
        return TICKET_STATUS_LOWER_BACKEND_MAP[value] ?? TicketStatus.Received;
    }
    return value as TicketStatus;
}
