import * as mongoUnit from 'mongo-unit';
import * as mongo from 'mongodb';
import {collectionName, customerReadingRepositoryFactory} from './mongo';
import {
    CustomerMeter,
    CustomerReading,
    CustomerReadingRepository,
    CustomerSupply
} from '../domain/customer';
import moment from 'frozen-moment';
import {Pagination} from '../util/pagination';

describe('mongo', () => {

    let mongoDb: mongo.Db;

    beforeAll(async () => {
        const url = await mongoUnit.start();
        const client = new mongo.MongoClient(url, { useNewUrlParser: true, useUnifiedTopology: true });
        await client.connect();
        mongoDb = client.db('testdb');
    }, 120_000); // long timeout as mongo-unit downloads on first use

    afterAll(async () => {
        await mongoUnit.stop()
    });

    describe('CustomerReadingRepository', () => {

        let repository: CustomerReadingRepository;

        beforeEach(async () => {
            try {
                await mongoDb.dropCollection(collectionName);
            } catch (e) {
                // collection doesn't exist yet.
            }
            repository = await customerReadingRepositoryFactory(mongoDb);
        });

        it('finds nothing when empty', async () => {
            const result = await repository.findByCustomerMeter({ customerId: 'id', serialNumber: 'sn' });
            expect(result).toHaveLength(0);
        });

        it('allows saving and retrieving reading by customer meter', async () => {
            const reading: CustomerReading = {
                customerId: 'cid',
                serialNumber: 'sn',
                mpxn: 'mpxn',
                readDate: moment(),
                read: [{
                    type: 'TYPE',
                    registerId: 'reg',
                    value: '123'
                }]
            };
            const meter: CustomerMeter = reading;

            await repository.save(reading);
            const result = await repository.findByCustomerMeter(meter);

            expect(result).toHaveLength(1);
            expect(result[0].customerId).toBe(reading.customerId);
            expect(result[0].serialNumber).toBe(reading.serialNumber);
            expect(result[0].mpxn).toBe(reading.mpxn);
            expect(result[0].readDate.format()).toEqual(reading.readDate.format());
            expect(result[0].read).toStrictEqual(reading.read);
        });

        it('allows saving and retrieving reading by customer supply', async () => {
            const reading: CustomerReading = {
                customerId: 'cid',
                serialNumber: 'sn',
                mpxn: 'mpxn',
                readDate: moment(),
                read: [{
                    type: 'TYPE',
                    registerId: 'reg',
                    value: '123'
                }]
            };
            const supply: CustomerSupply = reading;

            await repository.save(reading);
            const result = await repository.findByCustomerSupply(supply);

            expect(result).toHaveLength(1);
            expect(result[0].customerId).toBe(reading.customerId);
            expect(result[0].serialNumber).toBe(reading.serialNumber);
            expect(result[0].mpxn).toBe(reading.mpxn);
            expect(result[0].readDate.format()).toEqual(reading.readDate.format());
            expect(result[0].read).toStrictEqual(reading.read);
        });

        const createReadingForMeter = (customerMeter: CustomerMeter, readDate: moment.Moment = moment()): CustomerReading => {
            return {
                ...customerMeter,
                mpxn: 'mpxn',
                readDate,
                read: [{
                    type: 'TYPE',
                    registerId: 'reg',
                    value: '123',
                }]
            };
        };

        it('filters by customer meter', async () => {
            const meter1 = { customerId: 'c1', serialNumber: 'sn1' };
            const meter2 = { customerId: 'c2', serialNumber: 'sn2' };
            const meter3 = { customerId: 'c2', serialNumber: 'sn3' };

            await repository.save(createReadingForMeter(meter1));
            await repository.save(createReadingForMeter(meter1));
            await repository.save(createReadingForMeter(meter1));
            await repository.save(createReadingForMeter(meter2));
            await repository.save(createReadingForMeter(meter2));
            await repository.save(createReadingForMeter(meter3));

            let result = await repository.findByCustomerMeter(meter1);
            expect(result).toHaveLength(3);

            result = await repository.findByCustomerMeter(meter2);
            expect(result).toHaveLength(2);

            result = await repository.findByCustomerMeter(meter3);
            expect(result).toHaveLength(1);
        });

        it('paginates results for customer meter sorted by most recent', async () => {
            const meter = { customerId: 'c1', serialNumber: 'sn1' };

            const mom = moment().freeze();
            await repository.save(createReadingForMeter(meter, mom.subtract(10, 's')));
            await repository.save(createReadingForMeter(meter, mom.subtract(15, 's')));
            await repository.save(createReadingForMeter(meter, mom.subtract(5, 's')));
            await repository.save(createReadingForMeter(meter, mom.subtract(20, 's')));
            await repository.save(createReadingForMeter(meter, mom));

            let pagination = new Pagination(2);
            let page0 = await repository.findByCustomerMeter(meter, pagination);
            let page1 = await repository.findByCustomerMeter(meter, pagination.nextPage());
            let page2 = await repository.findByCustomerMeter(meter, pagination.nextPage().nextPage());

            expect(page0).toHaveLength(2);
            expect(page0[0].readDate.format()).toBe(mom.format());
            expect(page0[1].readDate.format()).toBe(mom.subtract(5, 's').format());

            expect(page1).toHaveLength(2);
            expect(page1[0].readDate.format()).toBe(mom.subtract(10, 's').format());
            expect(page1[1].readDate.format()).toBe(mom.subtract(15, 's').format());

            expect(page2).toHaveLength(1);
            expect(page2[0].readDate.format()).toBe(mom.subtract(20, 's').format());
        });

        const createReadingForSupply = (customerSupply: CustomerSupply, readDate: moment.Moment = moment()): CustomerReading => {
            return {
                ...customerSupply,
                serialNumber: 'sn',
                readDate,
                read: [{
                    type: 'TYPE',
                    registerId: 'reg',
                    value: '123',
                }]
            };
        };

        it('filters by customer supply', async () => {
            const supply1 = { customerId: 'c1', mpxn: 'm1' };
            const supply2 = { customerId: 'c2', mpxn: 'm2' };
            const supply3 = { customerId: 'c2', mpxn: 'm3' };

            await repository.save(createReadingForSupply(supply1));
            await repository.save(createReadingForSupply(supply1));
            await repository.save(createReadingForSupply(supply1));
            await repository.save(createReadingForSupply(supply2));
            await repository.save(createReadingForSupply(supply2));
            await repository.save(createReadingForSupply(supply3));

            let result = await repository.findByCustomerSupply(supply1);
            expect(result).toHaveLength(3);

            result = await repository.findByCustomerSupply(supply2);
            expect(result).toHaveLength(2);

            result = await repository.findByCustomerSupply(supply3);
            expect(result).toHaveLength(1);
        });

        it('paginates results for customer supply sorted by most recent', async () => {
            const supply = { customerId: 'c1', mpxn: 'mp1' };

            const mom = moment().freeze();
            await repository.save(createReadingForSupply(supply, mom.subtract(10, 's')));
            await repository.save(createReadingForSupply(supply, mom.subtract(15, 's')));
            await repository.save(createReadingForSupply(supply, mom.subtract(5, 's')));
            await repository.save(createReadingForSupply(supply, mom.subtract(20, 's')));
            await repository.save(createReadingForSupply(supply, mom));

            let pagination = new Pagination(2);
            let page0 = await repository.findByCustomerSupply(supply, pagination);
            let page1 = await repository.findByCustomerSupply(supply, pagination.nextPage());
            let page2 = await repository.findByCustomerSupply(supply, pagination.nextPage().nextPage());

            expect(page0).toHaveLength(2);
            expect(page0[0].readDate.format()).toBe(mom.format());
            expect(page0[1].readDate.format()).toBe(mom.subtract(5, 's').format());

            expect(page1).toHaveLength(2);
            expect(page1[0].readDate.format()).toBe(mom.subtract(10, 's').format());
            expect(page1[1].readDate.format()).toBe(mom.subtract(15, 's').format());

            expect(page2).toHaveLength(1);
            expect(page2[0].readDate.format()).toBe(mom.subtract(20, 's').format());
        });
    })

});