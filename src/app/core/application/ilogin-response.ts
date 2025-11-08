export interface ILoginResponse {
    tokenType?: string;
    accessToken: string;
    expiresIn: number;
    refreshToken: string;
    refreshTokenExpires: number;
}