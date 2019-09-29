import {invariant, notBlank, notEmpty} from './invariant';
import * as dateFns from 'date-fns';

// Arbitrary, just to give some more interesting validation.
export const earliestReadingDate = new Date('2000-01-01T00:00:00.000Z');

// MeterReading represents a simultaneous reading for all registers in the meter.
export type MeterReading = {
    readonly read: RegisterValue[]
    readonly readDate: Date
}

export function validateMeterReading(meterReading: MeterReading) {
    const { read, readDate } = meterReading;

    invariant('must have at least one register reading', notEmpty(read));
    read.forEach(validateRegisterValue);

    invariant(`reading must have been taken after ${earliestReadingDate}`, !dateFns.isBefore(readDate, earliestReadingDate))
}

export type RegisterValue = {
    readonly registerId: string
    readonly type: string // could be an enum if types are well-defined.
    readonly value: string
}

export function validateRegisterValue(registerValue: RegisterValue) {
    const { registerId, type, value } = registerValue;
    invariant('registerId must not be blank', notBlank(registerId));
    invariant('type must not be blank', notBlank(type));
    invariant('value must not be blank', notBlank(value));
}
