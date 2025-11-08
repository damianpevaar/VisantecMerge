export interface ManagedMailbox {
    id: string;
    address: string;
    displayName?: string | null;
    description?: string | null;
    isActive: boolean;
    autoResponseEnabled: boolean;
    autoResponseTemplate?: string | null;
}
