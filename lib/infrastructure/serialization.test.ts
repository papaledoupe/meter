import {parseCustomerReading, dateFormat, BadRequestError} from './serialization';
import moment from 'moment';

describe('serialization', () => {

    describe('parseCustomerReading', () => {

        it('returns CustomerReading from JSON', () => {
            const customerReading = parseCustomerReading(`
            {
                "customerId": "cid",
                "serialNumber": "sn",
                "mpxn": "m",
                "readDate": "2017-01-01T01:01:01+00:00Z",
                "read": [{
                    "registerId": "reg",
                    "type": "TYPE",
                    "value": "123"
                }]
            }
            `);

            expect(customerReading.customerId).toEqual("cid");
            expect(customerReading.serialNumber).toEqual("sn");
            expect(customerReading.mpxn).toEqual("m");
            expect(customerReading.readDate.format()).toEqual(moment.parseZone("2017-01-01T01:01:01+00:00Z", dateFormat).format());
            expect(customerReading.read).toEqual([{
                registerId: "reg",
                type: "TYPE",
                value: "123"
            }]);
        });

        it('returns CustomerReading when no reads and otherwise valid', () => {
            // The representation is correct from a serializn point of view; requiring at least one read is business
            // login.
            parseCustomerReading(`
            {
                "customerId": "cid",
                "serialNumber": "sn",
                "mpxn": "m",
                "readDate": "2017-01-01T01:01:01+00:00Z",
                "read": []
            }
            `);
        });

        it('throws error when missing customerId', () => {
            expect(() => parseCustomerReading(`
            {
                "serialNumber": "sn",
                "mpxn": "m",
                "readDate": "2017-01-01T01:01:01+00:00Z",
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
                "readDate": "2017-01-01T01:01:01+00:00Z",
                "read": [{
                    "registerId": "reg",
                    "type": "TYPE",
                    "value": "123"
                }]
            }
            `)).toThrow('customerId must be a string');
        });

        it('throws BadRequestError when missing serialNumber', () => {
            expect(() => parseCustomerReading(`
            {
                "customerId": "cid",
                "mpxn": "m",
                "readDate": "2017-01-01T01:01:01+00:00Z",
                "read": [{
                    "registerId": "reg",
                    "type": "TYPE",
                    "value": "123"
                }]
            }
            `)).toThrow(BadRequestError);
        });

        it('throws error when missing mpxn', () => {
            expect(() => parseCustomerReading(`
            {
                "customerId": "cid",
                "serialNumber": "sn",
                "readDate": "2017-01-01T01:01:01+00:00Z",
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
                "readDate": "2017-01-01T01:01:01+00:00Z",
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

        it('throws error when readDate is not zoned', () => {
            expect(() => parseCustomerReading(`
            {
                "customerId": "cid",
                "mpxn": "m",
                "serialNumber": "sn",
                "readDate": "2017-01-01T01:01:01",
                "read": []
            }
            `)).toThrow('readDate must be in format ' + dateFormat);
        });

    });

});
