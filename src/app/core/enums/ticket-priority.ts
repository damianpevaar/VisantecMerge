export enum TicketPriority {
    Low = 0,
    Medium = 1,
    High = 2,
    Critical = 3
}

export const TICKET_PRIORITY_LABELS: Record<TicketPriority, string> = {
    [TicketPriority.Low]: 'Baja',
    [TicketPriority.Medium]: 'Media',
    [TicketPriority.High]: 'Alta',
    [TicketPriority.Critical]: 'Crítica'
};

export const TICKET_PRIORITY_OPTIONS: TicketPriority[] = Object
  .values(TicketPriority)
  .filter((v): v is TicketPriority => typeof v === 'number');

// Mapeo auxiliar para los strings del backend
export const TICKET_PRIORITY_BACKEND_MAP: Record<string, TicketPriority> = {
    LOW: TicketPriority.Low,
    MEDIUM: TicketPriority.Medium,
    HIGH: TicketPriority.High,
    CRITICAL: TicketPriority.Critical
};

export const TICKET_PRIORITY_NUMBER_BACKEND_MAP: Record<number, string> = {
    0: 'LOW',
    1: 'MEDIUM',
    2: 'HIGH',
    3: 'CRITICAL'
};

export function getPriorityValue(value: string | number): TicketPriority {
    if (typeof value === 'string') {
        return TICKET_PRIORITY_BACKEND_MAP[value] ?? TicketPriority.Medium;
    }
    return value as TicketPriority;
}

export function getPriorityNumValue(value: string | number | undefined | null): string | undefined {
    if (value == null) return undefined;
    if (typeof value === 'number') {
        return TICKET_PRIORITY_NUMBER_BACKEND_MAP[value];
    }
    return undefined;
}