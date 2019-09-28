import {validateCustomerMeter, validateCustomerSupply, validateCustomerReading} from './customer';
import {InvariantBrokenError} from './invariant';
import {validateMeterReading} from './reading';
import moment from 'moment';

jest.mock('./reading', () => ({
    validateMeterReading: jest.fn(),
}));

describe('customer', () => {

    describe('validateCustomerMeter', () => {

        it.each`
        customerId | serialNumber
        ${''}      | ${'serial123'}
        ${' '}     | ${'serial123'}
        ${'\t'}    | ${'serial123'}
        ${'\n'}    | ${'serial123'}
        ${'c123'}  | ${''}
        ${'c123'}  | ${' '}
        ${'c123'}  | ${'\n'}
        ${'c123'}  | ${'\t'}
        `('raises error when customerId is "$customerId" and serialNumber is "$serialNumber', ({ customerId, serialNumber }) => {
            expect(() => validateCustomerMeter({ customerId, serialNumber })).toThrow(InvariantBrokenError);
        });

        it('does not raise error when customerId and serialNumber are non-blank strings', () => {
            validateCustomerMeter({
                customerId: 'identifier123',
                serialNumber: 'serial123',
            })
        });

    });

    describe('validateCustomerSuppl', () => {

        it.each`
        customerId | mpxn
        ${''}      | ${'1234'}
        ${' '}     | ${'1234'}
        ${'\t'}    | ${'1234'}
        ${'\n'}    | ${'1234'}
        ${'c123'}  | ${''}
        ${'c123'}  | ${' '}
        ${'c123'}  | ${'\n'}
        ${'c123'}  | ${'\t'}
        `('raises error when customerId is "$customerId" and mpxn is "$mpxn', ({ customerId, mpxn }) => {
            expect(() => validateCustomerSupply({ customerId, mpxn })).toThrow(InvariantBrokenError);
        });

        it('does not raise error when customerId and serialNumber are non-blank strings', () => {
            validateCustomerSupply({
                customerId: 'identifier123',
                mpxn: '1234',
            })
        });

    });

    describe('validateCustomerReading', () => {

        it('does not raise error when meter reading is valid', () => {
            (<jest.Mock>validateMeterReading).mockImplementation(() => {});

            validateCustomerReading({
                customerId: 'cid',
                serialNumber: 'sn',
                mpxn: 'mpxn',
                read: [],
                readDate: moment(),
            })
        });

        it('raises error when meter reading is not valid', () => {
            (<jest.Mock>validateMeterReading).mockImplementation(() => {
                throw new InvariantBrokenError('something was wrong');
            });

            expect(() => validateCustomerReading({
                customerId: 'cid',
                serialNumber: 'sn',
                mpxn: 'mpxn',
                read: [],
                readDate: moment(),
            })).toThrow(InvariantBrokenError);
        });

    });

});
