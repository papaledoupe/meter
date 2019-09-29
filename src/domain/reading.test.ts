import {earliestReadingDate, validateMeterReading, validateRegisterValue} from './reading';
import {InvariantBrokenError} from './invariant';
import * as dateFns from 'date-fns';

describe('reading', () => {

    describe('validateRegisterValue', () => {

        it.each`
        reg
        ${''}
        ${' '}
        ${'\t'}
        ${'\n'}
        `('throws when registerId is "$reg"', ({ reg }) => {
            expect(() => validateRegisterValue({
                registerId: reg,
                type: 'TYPE',
                value: '123'
            })).toThrow(InvariantBrokenError);
        });

        it.each`
        type
        ${''}
        ${' '}
        ${'\t'}
        ${'\n'}
        `('throws when type is "$type"', ({ type }) => {
            expect(() => validateRegisterValue({
                registerId: 'regid',
                type: type,
                value: '123'
            })).toThrow(InvariantBrokenError);
        });

        it.each`
        value
        ${''}
        ${' '}
        ${'\t'}
        ${'\n'}
        `('throws when value is "$value"', ({ value }) => {
            expect(() => validateRegisterValue({
                registerId: 'regid',
                type: 'TYPE',
                value: value
            })).toThrow(InvariantBrokenError);
        });

        it('does not throw when valid', () => {
            validateRegisterValue({
                registerId: 'reg',
                type: 'TYPE',
                value: 'value'
            });
        });
    });

    describe('validateMeterReading', () => {

        const validReading = {
            registerId: 'reg',
            type: 'TYPE',
            value: 'value'
        };

        it('throws when no register readings', () => {
            expect(() => validateMeterReading({
                read: [],
                readDate: new Date()
            })).toThrow(InvariantBrokenError);
        });

        it('does not throw when valid', () => {
            validateMeterReading({
                read: [validReading],
                readDate: new Date()
            });
        });

        it(`does not throw when reading taken on exactly ${earliestReadingDate}`, () => {
            validateMeterReading({
                read: [validReading],
                readDate: earliestReadingDate
            });
        });

        it(`throws when reading taken before ${earliestReadingDate}`, () => {
            expect(() => validateMeterReading({
                read: [validReading],
                readDate: dateFns.subSeconds(earliestReadingDate, 1)
            })).toThrow(InvariantBrokenError);
        });

    });

});