import * as mongoUnit from 'mongo-unit';
import * as mongo from 'mongodb';
import {collectionName, connectDb, customerReadingRepositoryFactory, disconnectDb} from './mongo';
import {CustomerMeter, CustomerReading, CustomerReadingRepository, CustomerSupply} from '../domain/customer';
import {Page, Paginator} from '../util/pagination';
import * as dateFns from 'date-fns';

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

        it('can be called multiple times with no side-effects', async () => {
            // was already called once during setup.
            await connectDb();
        });

    });

    describe('disconnectDb', () => {

        it('can be called multiple times with no side-effects', async () => {
            await disconnectDb();
            await disconnectDb();
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
                readDate: new Date(),
                read: [{
                    type: 'TYPE',
                    registerId: 'reg',
                    value: '123'
                }]
            };
            const meter: CustomerMeter = reading;

            await repository.save(reading);
            const page = await repository.findByCustomerMeter(meter);

            expect(page).toEqual(new Page([reading], new Paginator()));
        });

        it('allows saving and retrieving reading by customer supply', async () => {
            const reading: CustomerReading = {
                customerId: 'cid',
                serialNumber: 'sn',
                mpxn: 'mpxn',
                readDate: new Date(),
                read: [{
                    type: 'TYPE',
                    registerId: 'reg',
                    value: '123'
                }]
            };
            const supply: CustomerSupply = reading;

            await repository.save(reading);
            const page = await repository.findByCustomerSupply(supply);

            expect(page).toEqual(new Page([reading], new Paginator()));
        });

        const createReadingForMeter = (customerMeter: CustomerMeter, readDate: Date = new Date()): CustomerReading => {
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

            const now = new Date();
            await repository.save(createReadingForMeter(meter, dateFns.subSeconds(now, 10)));
            await repository.save(createReadingForMeter(meter, dateFns.subSeconds(now, 15)));
            await repository.save(createReadingForMeter(meter, dateFns.subSeconds(now, 5)));
            await repository.save(createReadingForMeter(meter, dateFns.subSeconds(now, 20)));
            await repository.save(createReadingForMeter(meter, now));

            let pagination = new Paginator(2);
            let page0 = await repository.findByCustomerMeter(meter, pagination);
            let page1 = await repository.findByCustomerMeter(meter, pagination.ofNextPage());
            let page2 = await repository.findByCustomerMeter(meter, pagination.ofNextPage().ofNextPage());

            expect(page0.results).toHaveLength(2);
            expect(page0.results[0].readDate).toStrictEqual(now);
            expect(page0.results[1].readDate).toStrictEqual(dateFns.subSeconds(now, 5));

            expect(page1.results).toHaveLength(2);
            expect(page1.results[0].readDate).toStrictEqual(dateFns.subSeconds(now, 10));
            expect(page1.results[1].readDate).toStrictEqual(dateFns.subSeconds(now, 15));

            expect(page2.results).toHaveLength(1);
            expect(page2.results[0].readDate).toStrictEqual(dateFns.subSeconds(now, 20));
        });

        const createReadingForSupply = (customerSupply: CustomerSupply, readDate: Date = new Date()): CustomerReading => {
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

            const now = new Date();
            await repository.save(createReadingForSupply(supply, dateFns.subSeconds(now, 10)));
            await repository.save(createReadingForSupply(supply, dateFns.subSeconds(now, 15)));
            await repository.save(createReadingForSupply(supply, dateFns.subSeconds(now, 5)));
            await repository.save(createReadingForSupply(supply, dateFns.subSeconds(now, 20)));
            await repository.save(createReadingForSupply(supply, now));

            let pagination = new Paginator(2);
            let page0 = await repository.findByCustomerSupply(supply, pagination);
            let page1 = await repository.findByCustomerSupply(supply, pagination.ofNextPage());
            let page2 = await repository.findByCustomerSupply(supply, pagination.ofNextPage().ofNextPage());

            expect(page0.results).toHaveLength(2);
            expect(page0.results[0].readDate).toStrictEqual(now);
            expect(page0.results[1].readDate).toStrictEqual(dateFns.subSeconds(now, 5));

            expect(page1.results).toHaveLength(2);
            expect(page1.results[0].readDate).toStrictEqual(dateFns.subSeconds(now, 10));
            expect(page1.results[1].readDate).toStrictEqual(dateFns.subSeconds(now, 15));

            expect(page2.results).toHaveLength(1);
            expect(page2.results[0].readDate).toStrictEqual(dateFns.subSeconds(now, 20));
        });
    })

});