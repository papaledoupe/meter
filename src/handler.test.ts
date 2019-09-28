import {readByMeter, readBySupply, write} from './handler';
import {SerializationError} from './infrastructure/serialization';
import {InvariantBrokenError} from './domain/invariant';
import {CustomerReading} from './domain/customer';
import moment from 'moment';
import {Paginator} from './util/pagination';

const customer = require('./domain/customer');
customer.validateCustomerReading = jest.fn();
customer.validateCustomerMeter = jest.fn();

const serialization = require('./infrastructure/serialization');
serialization.parseCustomerReading = jest.fn();

const mongo = require('./infrastructure/mongo');
mongo.customerReadingRepositoryFactory = jest.fn();
mongo.connectDb = jest.fn();
mongo.disconnectDb = jest.fn();

describe('handler', () => {

    beforeEach(() => {
        customer.validateCustomerReading.mockReset();
        customer.validateCustomerMeter.mockReset();
        serialization.parseCustomerReading.mockReset();
        mongo.customerReadingRepositoryFactory.mockReset();
        mongo.connectDb.mockReset();
        mongo.disconnectDb.mockReset();
    });

    describe('write', () => {

        it('returns HTTP 400 when serialization fails', async () => {
            serialization.parseCustomerReading.mockImplementation(() => { throw new SerializationError('not valid') });

            const result = await write({ body: 'my body' }, {});

            expect(result.body).toBe('{\"error\":\"not valid\"}');
            expect(result.statusCode).toBe(400);
            expect(serialization.parseCustomerReading).toHaveBeenCalledTimes(1);
            expect(serialization.parseCustomerReading).toHaveBeenCalledWith('my body');
        });

        it('returns HTTP 409 when customer reading invalid', async () => {
            const customerReading: CustomerReading = {
                customerId: "c",
                serialNumber: "sn",
                mpxn: "m",
                readDate: moment(),
                read: [],
            };
            serialization.parseCustomerReading.mockReturnValue(customerReading);
            customer.validateCustomerReading.mockImplementation(() => { throw new InvariantBrokenError('business rule broken') });

            const result = await write({ body: 'my body' }, {});

            expect(result.body).toBe('{\"error\":\"business rule broken\"}');
            expect(result.statusCode).toBe(409);
            expect(customer.validateCustomerReading).toHaveBeenCalledTimes(1);
            expect(customer.validateCustomerReading).toHaveBeenCalledWith(customerReading);
        });

        it('returns HTTP 500 when unexpected error', async () => {
            mongo.connectDb.mockImplementation(() => { throw new Error('unexpected') });

            const result = await write({ body: 'my body' }, {});

            expect(result.body).toBe('{\"error\":\"unexpected\"}');
            expect(result.statusCode).toBe(500);
        });

        it('returns HTTP 201 with created entity when reading saved', async () => {
            const customerReading: CustomerReading = {
                customerId: "c",
                serialNumber: "sn",
                mpxn: "m",
                readDate: moment(),
                read: [],
            };
            serialization.parseCustomerReading.mockReturnValue(customerReading);
            const mockRepository = { save: jest.fn() };
            mongo.customerReadingRepositoryFactory.mockResolvedValue(mockRepository);

            const result = await write({ body: 'my body' }, {});

            expect(result.statusCode).toBe(201);
            expect(result.body).toContain("\"customerId\":\"c\"");
            expect(mockRepository.save).toHaveBeenCalledTimes(1);
            expect(mockRepository.save).toHaveBeenCalledWith(customerReading);
        });

    });

    describe('readByMeter', () => {

        it('returns HTTP 200 with results', async () => {
            const mockRepository = {
                findByCustomerMeter: jest.fn().mockResolvedValue('results object')
            };
            mongo.customerReadingRepositoryFactory.mockResolvedValue(mockRepository);

            const result = await readByMeter({ pathParameters: { customerId: 'c', serialNumber: 'sn' } }, {});

            expect(result.body).toBe('\"results object\"');
            expect(result.statusCode).toBe(200);
            expect(mockRepository.findByCustomerMeter).toHaveBeenCalledTimes(1);
            expect(mockRepository.findByCustomerMeter).toHaveBeenCalledWith({ customerId: 'c', serialNumber: 'sn' }, new Paginator());
        });

    });

    describe('readBySupply', () => {

        it('returns HTTP 200 with results', async () => {
            const mockRepository = {
                findByCustomerSupply: jest.fn().mockResolvedValue('results object')
            };
            mongo.customerReadingRepositoryFactory.mockResolvedValue(mockRepository);

            const result = await readBySupply({ pathParameters: { customerId: 'c', mpxn: 'm' } }, {});

            expect(result.body).toBe('\"results object\"');
            expect(result.statusCode).toBe(200);
            expect(mockRepository.findByCustomerSupply).toHaveBeenCalledTimes(1);
            expect(mockRepository.findByCustomerSupply).toHaveBeenCalledWith({ customerId: 'c', mpxn: 'm' }, new Paginator());
        });

    });

});