import {invariant, notBlank, notEmpty} from './invariant';
import * as moment from 'frozen-moment';

// Arbitrary, just to give some more interesting validation.
export const earliestReadingDate = moment('2000-01-01T00:00:00.000Z')
    // moment instances are mutable, which is very dangerous in situations like this. frozen-moment avoids this.
    .freeze();

// MeterReading represents a simultaneous reading for all registers in the meter.
export type MeterReading = {
    read: RegisterValue[]
    readDate: moment.Moment
}

export function validateMeterReading(meterReading: MeterReading) {
    const { read, readDate } = meterReading;

    invariant('must have at least one register reading', notEmpty(read));
    read.forEach(validateRegisterValue);

    invariant(`reading must have been taken after ${earliestReadingDate}`, readDate.isSameOrAfter(earliestReadingDate, 'ms'))
}

export type RegisterValue = {
    registerId: string
    type: string // could be an enum if types are well-defined.
    value: string
}

export function validateRegisterValue(registerValue: RegisterValue) {
    const { registerId, type, value } = registerValue;
    invariant('registerId must not be blank', notBlank(registerId));
    invariant('type must not be blank', notBlank(type));
    invariant('value must not be blank', notBlank(value));
}
