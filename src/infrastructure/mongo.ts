import * as mongo from 'mongodb';
import {CustomerMeter, CustomerReading, CustomerReadingRepository, CustomerSupply} from '../domain/customer';
import {Page, Paginator} from '../util/pagination';
import moment from 'moment';
import {requireEnv} from '../util/env';

// customerId is used as _id.
export const collectionName = 'customerReading';

export type CustomerReadingDoc = Omit<CustomerReading, 'readDate'> & { readonly readDate: Date }

export async function customerReadingRepositoryFactory(db: mongo.Db): Promise<CustomerReadingRepository> {

    // Since this data is business critical, ensure majority of nodes have accepted the write. This also implies j: true
    // (i.e., ensure changes written to journal on nodes' disk)
    const writeConcern: mongo.CommonOptions = {
        w: 'majority',
    };

    const collection = await db.collection<CustomerReadingDoc>(collectionName);
    // The service supports retrieval by meter and supply. This can't be achieved with a single index, since mongo indices
    // are prefix-based.
    await collection.createIndex({ customerId: 1, serialNumber: 1 });
    await collection.createIndex({ customerId: 1, mpxn: 1 });
    // index order doesn't matter for single fields.
    await collection.createIndex({ readDate: 1 });

    const toDoc = (customerReading: CustomerReading): CustomerReadingDoc => ({
        ...customerReading,
        readDate: customerReading.readDate.toDate()
    });

    const fromDoc = (doc: CustomerReadingDoc): CustomerReading => ({
        ...doc,
        readDate: moment(doc.readDate),
    });

    const find = async (query: {}, paginator: Paginator): Promise<Page<CustomerReading>> => {
        const cursor = collection.find(query, {
            projection: { _id: 0 },
            sort: { readDate: -1 },
        });
        const docs = await cursor.skip(paginator.skip).limit(paginator.limit).toArray();
        return paginator.createPage(docs.map(fromDoc));
    };

    return {
        async save(customerReading: CustomerReading): Promise<void> {
            await collection.insertOne(toDoc(customerReading), writeConcern);
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
    await mongoClient.close()
};
