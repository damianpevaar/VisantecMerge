export interface IRole {
    id: string;
    name: string;
}

export interface ClientSummary {
  id: string;
  name: string;
}

export interface RoleItem {
  id: string;
  name: string;
  baseRoleId?: string | null;
  baseRoleName?: string | null;
  description?: string | null;
  clients?: ClientSummary[];
  isClientRole?: boolean;
}