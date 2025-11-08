export enum VisitorTimeSlot {
    SixAmToFiveFiftyNinePm = 0,
    SixPmToFiveFiftyNineAm = 1,
    AllDay = 2
}

export const VISITOR_TIME_SLOT_LABELS: Record<VisitorTimeSlot, string> = {
    [VisitorTimeSlot.SixAmToFiveFiftyNinePm]: '6:00 a. m. - 5:59 p. m.',
    [VisitorTimeSlot.SixPmToFiveFiftyNineAm]: '6:00 p. m. - 5:59 a. m.',
    [VisitorTimeSlot.AllDay]: 'Todo el dia'
};

export const VISITOR_TIME_SLOT_OPTIONS: VisitorTimeSlot[] = Object
    .values(VisitorTimeSlot)
    .filter((value): value is VisitorTimeSlot => typeof value === 'number');

const VISITOR_TIME_SLOT_BACKEND_MAP: Record<string, VisitorTimeSlot> = {
    SIX_AM_TO_FIVE_FIFTY_NINE_PM: VisitorTimeSlot.SixAmToFiveFiftyNinePm,
    SIX_PM_TO_FIVE_FIFTY_NINE_AM: VisitorTimeSlot.SixPmToFiveFiftyNineAm,
    ALL_DAY: VisitorTimeSlot.AllDay
};

const VISITOR_TIME_SLOT_NUMBER_BACKEND_MAP: Record<number, string> = {
    [VisitorTimeSlot.SixAmToFiveFiftyNinePm]: 'SIX_AM_TO_FIVE_FIFTY_NINE_PM',
    [VisitorTimeSlot.SixPmToFiveFiftyNineAm]: 'SIX_PM_TO_FIVE_FIFTY_NINE_AM',
    [VisitorTimeSlot.AllDay]: 'ALL_DAY'
};

export function getVisitorTimeSlotValue(value: string | number | null | undefined): VisitorTimeSlot | null {
    if (value == null) {
        return null;
    }
    if (typeof value === 'number') {
        return value as VisitorTimeSlot;
    }
    return VISITOR_TIME_SLOT_BACKEND_MAP[value] ?? null;
}

export function getVisitorTimeSlotCode(value: VisitorTimeSlot | null | undefined): string | undefined {
    if (value == null) {
        return undefined;
    }
    return VISITOR_TIME_SLOT_NUMBER_BACKEND_MAP[value];
}
