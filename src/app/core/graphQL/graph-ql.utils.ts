import { IGraphQLFilter } from "../application/igraph-qlfilter"

export function removeNullProps<T extends object>(obj: T): Partial<T> {
    return Object.fromEntries(
        Object.entries(obj).filter(([_, value]) => value !== null && value !== undefined)
    ) as Partial<T>
}

export function PrepareVariables<T extends IGraphQLFilter>(obj: T): T {
    obj.where = removeNullProps(obj.where);
    return obj;
}