export interface IRole {
    id: string;
    name: string;
}

export interface RoleItem {
  id: string;
  name: string;
  clients?: Array<{ id: string; name: string }>;
}
