import { IGraphQLDataType } from "../../../core/domain/igraph-qldata-type";
import { IUser } from "../../../core/domain/iuser";

export interface IGetUsersResponse {
    users: IGraphQLDataType<IUser>;
}
