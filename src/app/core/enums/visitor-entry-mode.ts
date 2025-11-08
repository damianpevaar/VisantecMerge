export enum VisitorEntryMode {
    Pedestrian = 0,
    Vehicle = 1,
    Motorcycle = 2,
    Bicycle = 3
}

export const VISITOR_ENTRY_MODE_LABELS: Record<VisitorEntryMode, string> = {
    [VisitorEntryMode.Pedestrian]: 'Peatonal',
    [VisitorEntryMode.Vehicle]: 'Vehicular',
    [VisitorEntryMode.Motorcycle]: 'Moto',
    [VisitorEntryMode.Bicycle]: 'Bicicleta'
};

export const VISITOR_ENTRY_MODE_OPTIONS: VisitorEntryMode[] = Object
    .values(VisitorEntryMode)
    .filter((value): value is VisitorEntryMode => typeof value === 'number');

const VISITOR_ENTRY_MODE_BACKEND_MAP: Record<string, VisitorEntryMode> = {
    PEDESTRIAN: VisitorEntryMode.Pedestrian,
    VEHICLE: VisitorEntryMode.Vehicle,
    MOTORCYCLE: VisitorEntryMode.Motorcycle,
    BICYCLE: VisitorEntryMode.Bicycle
};

const VISITOR_ENTRY_MODE_NUMBER_BACKEND_MAP: Record<number, string> = {
    [VisitorEntryMode.Pedestrian]: 'PEDESTRIAN',
    [VisitorEntryMode.Vehicle]: 'VEHICLE',
    [VisitorEntryMode.Motorcycle]: 'MOTORCYCLE',
    [VisitorEntryMode.Bicycle]: 'BICYCLE'
};

export function getVisitorEntryModeValue(value: string | number | null | undefined): VisitorEntryMode {
    if (value == null) {
        return VisitorEntryMode.Pedestrian;
    }
    if (typeof value === 'number') {
        return value as VisitorEntryMode;
    }
    return VISITOR_ENTRY_MODE_BACKEND_MAP[value] ?? VisitorEntryMode.Pedestrian;
}

export function getVisitorEntryModeCode(value: VisitorEntryMode | null | undefined): string | undefined {
    if (value == null) {
        return undefined;
    }
    return VISITOR_ENTRY_MODE_NUMBER_BACKEND_MAP[value];
}
