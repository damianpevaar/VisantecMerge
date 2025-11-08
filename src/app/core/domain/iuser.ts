export interface IUser {
    id: string;
    userName: string;
    email: string;
    phoneNumber?: string | null;
    roles: string[];
    isActive: boolean;
    status?: {
        userId: string;
        isActive: boolean;
        lastUpdated?: string | null;
    };
    // client-only flag used to disable UI controls while saving status
    __savingStatus?: boolean;
}
