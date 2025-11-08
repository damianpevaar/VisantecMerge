export interface ClientOrganization {
    id: string;
    name: string;
    taxId?: string | null;
    contactEmail?: string | null;
    contactPhone?: string | null;
    isActive: boolean;
}
