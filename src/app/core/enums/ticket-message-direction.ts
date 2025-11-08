export enum TicketMessageDirection {
    Incoming = 'Incoming',
    Outgoing = 'Outgoing',
    Internal = 'Internal',
    System = 'System'
}

export const TICKET_MESSAGE_DIRECTION_LABELS: Record<TicketMessageDirection, string> = {
    [TicketMessageDirection.Incoming]: 'Entrante',
    [TicketMessageDirection.Outgoing]: 'Saliente',
    [TicketMessageDirection.Internal]: 'Interno',
    [TicketMessageDirection.System]: 'Sistema'
};
