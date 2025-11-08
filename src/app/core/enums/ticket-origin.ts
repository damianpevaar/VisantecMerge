export enum TicketOrigin {
    Email = 'Email',
    Platform = 'Platform'
}

export const TICKET_ORIGIN_LABELS: Record<TicketOrigin, string> = {
    [TicketOrigin.Email]: 'Correo',
    [TicketOrigin.Platform]: 'Plataforma'
};

export const TICKET_ORIGIN_OPTIONS = Object.values(TicketOrigin);

export const TICKET_ORIGIN_NUMBER_BACKEND_MAP: Record<string, string> = {
    'Email': 'EMAIL',
    'Platform': 'PLATFORM'
};

export function getOriginValue(value: string | undefined | null): string | undefined {
    if (value == null) return undefined;
    // Si el valor ya es el string backend, lo retorna tal cual
    if (typeof value === 'string') {
        return TICKET_ORIGIN_NUMBER_BACKEND_MAP[value] ?? value;
    }
    return value;
}