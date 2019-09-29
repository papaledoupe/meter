import {dateFormat, optionalInt, parseCustomerReading, requireDate, SerializationError} from './serialization';

describe('serialization', () => {

    describe('parseCustomerReading', () => {

        it('returns CustomerReading from JSON', () => {
            const customerReading = parseCustomerReading(`
            {
                "customerId": "cid",
                "serialNumber": "sn",
                "mpxn": "m",
                "readDate": "2017-01-01T01:01:01Z",
                "read": [{
                    "registerId": "reg",
                    "type": "TYPE",
                    "value": "123"
                }]
            }
            `);

            expect(customerReading).toEqual({
                customerId: 'cid',
                serialNumber: 'sn',
                mpxn: 'm',
                readDate: new Date("2017-01-01T01:01:01Z"),
                read: [{
                    registerId: "reg",
                    type: "TYPE",
                    value: "123"
                }]
            });
        });

        it('returns CustomerReading when no reads and otherwise valid', () => {
            // The representation is correct from a serializn point of view; requiring at least one read is business
            // login.
            parseCustomerReading(`
            {
                "customerId": "cid",
                "serialNumber": "sn",
                "mpxn": "m",
                "readDate": "2017-01-01T01:01:01Z",
                "read": []
            }
            `);
        });

        it('throws error when missing customerId', () => {
            expect(() => parseCustomerReading(`
            {
                "serialNumber": "sn",
                "mpxn": "m",
                "readDate": "2017-01-01T01:01:01Z",
                "read": [{
                    "registerId": "reg",
                    "type": "TYPE",
                    "value": "123"
                }]
            }
            `)).toThrow('customerId is required');
        });

        it('throws error when customerId is number', () => {
            expect(() => parseCustomerReading(`
            {
                "customerId": 1,
                "serialNumber": "sn",
                "mpxn": "m",
                "readDate": "2017-01-01T01:01:01Z",
                "read": [{
                    "registerId": "reg",
                    "type": "TYPE",
                    "value": "123"
                }]
            }
            `)).toThrow('customerId must be a string');
        });

        it('throws error when missing serialNumber', () => {
            expect(() => parseCustomerReading(`
            {
                "customerId": "cid",
                "mpxn": "m",
                "readDate": "2017-01-01T01:01:01Z",
                "read": [{
                    "registerId": "reg",
                    "type": "TYPE",
                    "value": "123"
                }]
            }
            `)).toThrow(SerializationError);
        });

        it('throws error when missing mpxn', () => {
            expect(() => parseCustomerReading(`
            {
                "customerId": "cid",
                "serialNumber": "sn",
                "readDate": "2017-01-01T01:01:01Z",
                "read": [{
                    "registerId": "reg",
                    "type": "TYPE",
                    "value": "123"
                }]
            }
            `)).toThrow('mpxn is required');
        });

        it('throws error when missing read is not an array', () => {
            expect(() => parseCustomerReading(`
            {
                "customerId": "cid",
                "mpxn": "m",
                "serialNumber": "sn",
                "readDate": "2017-01-01T01:01:01Z",
                "read": "4"
            }
            `)).toThrow('read must be an array');
        });

        it('throws error when readDate is not a valid datetime', () => {
            expect(() => parseCustomerReading(`
            {
                "customerId": "cid",
                "mpxn": "m",
                "serialNumber": "sn",
                "readDate": "2017-01-01",
                "read": []
            }
            `)).toThrow('readDate must be in format ' + dateFormat);
        });

    });

    describe('requireDate', () => {

        it.each`
        d
        ${'2001-01-01'}
        ${'2001-01-01 00:00:00'}
        ${'2001-01-01T00:00:00'}
        ${'2001-01-01T00:00:00.000'}
        ${'2001-01-01T00:00:00+00:00Z'}
        `('throws error when not in required format (example: $d)', ({d}) => {
            expect(() => requireDate({d}, 'd')).toThrow(SerializationError);
        });

        it.each`
        d
        ${'2001-01-01T00:00:00+00:00'}
        ${'2001-01-01T00:00:00Z'}
        `('accepts required format (example: $d)', ({d}) => {
            requireDate({d}, 'd');
        })

    });

    describe('Date.prototype.toJSON monkey patch', () => {

        it('serializes Date without fractional seconds', () => {
            const result = new Date("2017-01-01T12:00:00.000Z").toJSON();
            expect(result).toEqual('2017-01-01T12:00:00Z');
        });

    });

    describe('optionalInt', () => {

        it('returns null when key does not exist on object', () => {
            expect(optionalInt({}, 'k')).toBeNull();
        });

        it('returns null when key on object but not integer', () => {
            expect(optionalInt({ k: 'hello' }, 'k')).toBeNull();
        });

        it('returns number when key on object and is integer', () => {
            expect(optionalInt({ k: 4 }, 'k')).toBe(4);
        });

        it('returns number when key on object and can be parsed to integer', () => {
            expect(optionalInt({ k: '4' }, 'k')).toBe(4);
        });

    });

});
