import * as mongoUnit from 'mongo-unit';
import * as mongo from 'mongodb';
import {collectionName, customerReadingRepositoryFactory, connectDb, disconnectDb} from './mongo';
import {
    CustomerMeter,
    CustomerReading,
    CustomerReadingRepository,
    CustomerSupply
} from '../domain/customer';
import moment from 'frozen-moment';
import {Paginator} from '../util/pagination';

describe('mongo', () => {

    let mongoDb: mongo.Db;

    beforeAll(async () => {
        const url = await mongoUnit.start();
        process.env['MONGO_URL'] = url;
        mongoDb = await connectDb();
    }, 120_000); // long timeout as mongo-unit downloads on first use

    afterAll(async () => {
        await disconnectDb();
        await mongoUnit.stop()
    });

    describe('connectDb', () => {

        it('can be called multiple times', async () => {
            // was already called once during setup.
            await connectDb();
        });

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
            const page = await repository.findByCustomerMeter({ customerId: 'id', serialNumber: 'sn' });
            expect(page.results).toHaveLength(0);
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
            const page = await repository.findByCustomerMeter(meter);

            expect(page.results).toHaveLength(1);
            expect(page.results[0].customerId).toBe(reading.customerId);
            expect(page.results[0].serialNumber).toBe(reading.serialNumber);
            expect(page.results[0].mpxn).toBe(reading.mpxn);
            expect(page.results[0].readDate.format()).toEqual(reading.readDate.format());
            expect(page.results[0].read).toStrictEqual(reading.read);
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
            const page = await repository.findByCustomerSupply(supply);

            expect(page.results).toHaveLength(1);
            expect(page.results[0].customerId).toBe(reading.customerId);
            expect(page.results[0].serialNumber).toBe(reading.serialNumber);
            expect(page.results[0].mpxn).toBe(reading.mpxn);
            expect(page.results[0].readDate.format()).toEqual(reading.readDate.format());
            expect(page.results[0].read).toStrictEqual(reading.read);
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

            let page = await repository.findByCustomerMeter(meter1);
            expect(page.results).toHaveLength(3);

            page = await repository.findByCustomerMeter(meter2);
            expect(page.results).toHaveLength(2);

            page = await repository.findByCustomerMeter(meter3);
            expect(page.results).toHaveLength(1);
        });

        it('paginates pages for customer meter sorted by most recent', async () => {
            const meter = { customerId: 'c1', serialNumber: 'sn1' };

            const mom = moment().freeze();
            await repository.save(createReadingForMeter(meter, mom.subtract(10, 's')));
            await repository.save(createReadingForMeter(meter, mom.subtract(15, 's')));
            await repository.save(createReadingForMeter(meter, mom.subtract(5, 's')));
            await repository.save(createReadingForMeter(meter, mom.subtract(20, 's')));
            await repository.save(createReadingForMeter(meter, mom));

            let pagination = new Paginator(2);
            let page0 = await repository.findByCustomerMeter(meter, pagination);
            let page1 = await repository.findByCustomerMeter(meter, pagination.ofNextPage());
            let page2 = await repository.findByCustomerMeter(meter, pagination.ofNextPage().ofNextPage());

            expect(page0.results).toHaveLength(2);
            expect(page0.results[0].readDate.format()).toBe(mom.format());
            expect(page0.results[1].readDate.format()).toBe(mom.subtract(5, 's').format());

            expect(page1.results).toHaveLength(2);
            expect(page1.results[0].readDate.format()).toBe(mom.subtract(10, 's').format());
            expect(page1.results[1].readDate.format()).toBe(mom.subtract(15, 's').format());

            expect(page2.results).toHaveLength(1);
            expect(page2.results[0].readDate.format()).toBe(mom.subtract(20, 's').format());
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

            let page = await repository.findByCustomerSupply(supply1);
            expect(page.results).toHaveLength(3);

            page = await repository.findByCustomerSupply(supply2);
            expect(page.results).toHaveLength(2);

            page = await repository.findByCustomerSupply(supply3);
            expect(page.results).toHaveLength(1);
        });

        it('paginates pages for customer supply sorted by most recent', async () => {
            const supply = { customerId: 'c1', mpxn: 'mp1' };

            const mom = moment().freeze();
            await repository.save(createReadingForSupply(supply, mom.subtract(10, 's')));
            await repository.save(createReadingForSupply(supply, mom.subtract(15, 's')));
            await repository.save(createReadingForSupply(supply, mom.subtract(5, 's')));
            await repository.save(createReadingForSupply(supply, mom.subtract(20, 's')));
            await repository.save(createReadingForSupply(supply, mom));

            let pagination = new Paginator(2);
            let page0 = await repository.findByCustomerSupply(supply, pagination);
            let page1 = await repository.findByCustomerSupply(supply, pagination.ofNextPage());
            let page2 = await repository.findByCustomerSupply(supply, pagination.ofNextPage().ofNextPage());

            expect(page0.results).toHaveLength(2);
            expect(page0.results[0].readDate.format()).toBe(mom.format());
            expect(page0.results[1].readDate.format()).toBe(mom.subtract(5, 's').format());

            expect(page1.results).toHaveLength(2);
            expect(page1.results[0].readDate.format()).toBe(mom.subtract(10, 's').format());
            expect(page1.results[1].readDate.format()).toBe(mom.subtract(15, 's').format());

            expect(page2.results).toHaveLength(1);
            expect(page2.results[0].readDate.format()).toBe(mom.subtract(20, 's').format());
        });
    })

});