import { Injectable } from '@angular/core';
import { forkJoin, map, Observable } from 'rxjs';
import { RolesService } from './roles-service';

export type RoleOption = {
  id: string;
  name: string;
  normalizedName?: string;
  type?: 'base' | 'client';
};

@Injectable({ providedIn: 'root' })
export class RolesFacadeService {
  constructor(private rolesService: RolesService) {}

  /**
   * Returns a merged list of base roles and client roles (deduped, preferring base roles)
   */
  getCombinedRoles(first = 100): Observable<RoleOption[]> {
    const base$ = this.rolesService.getRoles(first);
    const client$ = this.rolesService.getClientRoles(first);

    return forkJoin([base$, client$]).pipe(
      map(([baseNodes, clientNodes]: any) => {
        const baseRoles: RoleOption[] = (baseNodes || []).map((r: any) => ({
          id: r.id,
          name: r.name,
          normalizedName: r.normalizedName,
          type: 'base'
        }));

        const clientRoles: RoleOption[] = (clientNodes || []).map((r: any) => ({
          id: r.id,
          name: r.name,
          type: 'client'
        }));

        const merged = [...baseRoles, ...clientRoles];
        const mapById = new Map<string, RoleOption>();
        merged.forEach(r => {
          const existing = mapById.get(r.id);
          if (!existing) mapById.set(r.id, { ...r });
          else {
            if (existing.type === 'base') return;
            mapById.set(r.id, { ...existing, ...r });
          }
        });

        return Array.from(mapById.values());
      })
    );
  }
}
