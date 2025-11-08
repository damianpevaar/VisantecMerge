export enum VisitorDocumentType {
    CC = 0,
    CE = 1,
    Pasaporte = 2,
    TC = 3
}

export const VISITOR_DOCUMENT_TYPE_LABELS: Record<VisitorDocumentType, string> = {
    [VisitorDocumentType.CC]: 'CC',
    [VisitorDocumentType.CE]: 'CE',
    [VisitorDocumentType.Pasaporte]: 'Pasaporte',
    [VisitorDocumentType.TC]: 'Tarjeta de identidad'
};

export const VISITOR_DOCUMENT_TYPE_OPTIONS: VisitorDocumentType[] = Object
    .values(VisitorDocumentType)
    .filter((value): value is VisitorDocumentType => typeof value === 'number');

const VISITOR_DOCUMENT_TYPE_BACKEND_MAP: Record<string, VisitorDocumentType> = {
    CC: VisitorDocumentType.CC,
    CE: VisitorDocumentType.CE,
    PASAPORTE: VisitorDocumentType.Pasaporte,
    TC: VisitorDocumentType.TC
};

const VISITOR_DOCUMENT_TYPE_NUMBER_BACKEND_MAP: Record<number, string> = {
    [VisitorDocumentType.CC]: 'CC',
    [VisitorDocumentType.CE]: 'CE',
    [VisitorDocumentType.Pasaporte]: 'PASAPORTE',
    [VisitorDocumentType.TC]: 'TC'
};

export function getVisitorDocumentTypeValue(value: string | number | null | undefined): VisitorDocumentType {
    if (value == null) {
        return VisitorDocumentType.CC;
    }
    if (typeof value === 'number') {
        return value as VisitorDocumentType;
    }
    return VISITOR_DOCUMENT_TYPE_BACKEND_MAP[value] ?? VisitorDocumentType.CC;
}

export function getVisitorDocumentTypeCode(value: VisitorDocumentType | null | undefined): string | undefined {
    if (value == null) {
        return undefined;
    }
    return VISITOR_DOCUMENT_TYPE_NUMBER_BACKEND_MAP[value];
}
