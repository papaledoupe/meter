import {APIGatewayEvent, Context, ProxyResult} from 'aws-lambda';
import 'source-map-support/register';
import {
    CustomerMeter,
    CustomerReading,
    CustomerSupply,
    validateCustomerMeter,
    validateCustomerReading, validateCustomerSupply
} from './domain/customer';
import {optionalInt, parseCustomerReading, requireString, SerializationError} from './infrastructure/serialization';
import {connectDb, disconnectDb, customerReadingRepositoryFactory} from './infrastructure/mongo';
import {InvariantBrokenError} from './domain/invariant';
import {Paginator} from './util/pagination';

const jsonResponse = (statusCode: number, body: any): ProxyResult => ({
    statusCode,
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' }
});

const errorResponse = (statusCode: number, error: Error): ProxyResult => jsonResponse(statusCode, { error: error.message });

const handler = (fn: (event: APIGatewayEvent, context: Context) => Promise<ProxyResult>) => async (event, context) => {
    try {
        return await fn(event, context);
    } catch (e) {
        if (e instanceof SerializationError) {
            return errorResponse(400, e);
        }
        if (e instanceof InvariantBrokenError) {
            return errorResponse(409, e);
        }
        return errorResponse(500, e);
    } finally {
        await disconnectDb();
    }
};

const getPaginator = (queryParams: { [key: string]: string }): Paginator => new Paginator(
    optionalInt(queryParams, 'limit'),
    optionalInt(queryParams, 'skip'),
);

// FUNCTIONS

export const write = handler(async event => {
    const customerReading: CustomerReading = parseCustomerReading(event.body);
    validateCustomerReading(customerReading);

    const repository = await customerReadingRepositoryFactory(await connectDb());
    await repository.save(customerReading);

    return jsonResponse(201, customerReading);
});

export const readByMeter = handler(async event => {
    const customerId = requireString(event.pathParameters, 'customerId');
    const serialNumber = requireString(event.pathParameters, 'serialNumber');
    const customerMeter: CustomerMeter = { customerId, serialNumber };
    validateCustomerMeter(customerMeter);

    const repository = await customerReadingRepositoryFactory(await connectDb());
    const readings = await repository.findByCustomerMeter(customerMeter, getPaginator(event.queryStringParameters || {}));

    return jsonResponse(200, readings);
});

export const readBySupply = handler(async event => {
    const customerId = requireString(event.pathParameters, 'customerId');
    const mpxn = requireString(event.pathParameters, 'mpxn');
    const customerSupply: CustomerSupply = { customerId, mpxn };
    validateCustomerSupply(customerSupply);

    const repository = await customerReadingRepositoryFactory(await connectDb());
    const readings = await repository.findByCustomerSupply(customerSupply, getPaginator(event.queryStringParameters || {}));

    return jsonResponse(200, readings);
});
