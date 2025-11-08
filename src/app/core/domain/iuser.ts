export interface IUser {
  id: string;
  userName: string;
  email: string;
  phoneNumber?: string | null;
  roles: string[];
  isActive: boolean;
  status?: {
    isActive: boolean;
    lastUpdated?: string | null;
  };
  __savingStatus?: boolean;
}
