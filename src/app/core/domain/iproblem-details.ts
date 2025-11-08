export interface IProblemDetails {
    type: string;
    title: string;
    status: number;
    detail: string;
    errors: IValidationErrors;
}

export interface IValidationErrors {
    LoanApplicationId: string[]
}
