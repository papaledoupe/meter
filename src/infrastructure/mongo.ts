import * as mongo from 'mongodb';
import {CustomerMeter, CustomerReading, CustomerReadingRepository, CustomerSupply} from '../domain/customer';
import {Page, Paginator} from '../util/pagination';
import {requireEnv} from '../util/env';

// customerId is used as _id.
export const collectionName = 'customerReading';

export async function customerReadingRepositoryFactory(db: mongo.Db): Promise<CustomerReadingRepository> {

    // Since this data is business critical, ensure majority of nodes have accepted the write. This also implies j: true
    // (i.e., ensure changes written to journal on nodes' disk)
    const writeConcern: mongo.CommonOptions = {
        w: 'majority',
    };

    const collection = await db.collection<CustomerReading>(collectionName);
    // The service supports retrieval by meter and supply. This can't be achieved with a single index, since mongo indices
    // are prefix-based.
    await collection.createIndex({ customerId: 1, serialNumber: 1 });
    await collection.createIndex({ customerId: 1, mpxn: 1 });
    // index order doesn't matter for single fields.
    await collection.createIndex({ readDate: 1 });

    const find = async (query: {}, paginator: Paginator): Promise<Page<CustomerReading>> => {
        const cursor = collection.find(query, {
            projection: {
                // project out the _id field.
                _id: 0,
                // annoyingly, cannot use negated projection (_id: 0) to exclude only individual keys
                customerId: 1,
                serialNumber: 1,
                mpxn: 1,
                readDate: 1,
                read: 1,
            },
            sort: { readDate: -1 },
        });
        const docs = await cursor
            .skip(paginator.skip)
            .limit(paginator.limit)
            .toArray();
        return paginator.createPage(docs);
    };

    return {
        async save(customerReading: CustomerReading): Promise<void> {
            // using assign because mongo mutates the underlying object with _id
            await collection.insertOne(Object.assign({}, customerReading), writeConcern);
        },

        async findByCustomerMeter(customerMeter: CustomerMeter, paginator: Paginator = new Paginator()): Promise<Page<CustomerReading>> {
            const { customerId, serialNumber } = customerMeter;
            return await find({ customerId, serialNumber }, paginator);
        },

        async findByCustomerSupply(customerSupply: CustomerSupply, paginator: Paginator = new Paginator()): Promise<Page<CustomerReading>> {
            const { customerId, mpxn } = customerSupply;
            return await find({ customerId, mpxn }, paginator);
        }
    }
}

let mongoClient: mongo.MongoClient;
export const connectDb = async (): Promise<mongo.Db> => {
    if (!mongoClient) {
        const dbUrl = requireEnv('MONGO_URL');
        mongoClient = new mongo.MongoClient(dbUrl, {useNewUrlParser: true, useUnifiedTopology: true});
        await mongoClient.connect();
    }
    return mongoClient.db();
};

export const disconnectDb = async (): Promise<void> => {
    if (mongoClient) {
        await mongoClient.close()
    }
    mongoClient = null;
};
