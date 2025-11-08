export interface IGraphQLFilter {
    where: object;
    after: string | null;
    first: number;
    order: object | null
}
