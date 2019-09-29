import * as compose from 'docker-compose'
import {condition} from './util';
import path from 'path';
import {IDockerComposeOptions} from 'docker-compose';
import fetch from 'node-fetch';
import uuid from 'uuid';

const setupTimeoutMs = 60_000;
const testTimeoutMs = 10_000;

const defaultComposeArgs: IDockerComposeOptions = {
    cwd: path.join(__dirname),
};

describe('meter', () => {

    let baseUrl: string;

    beforeAll(async () => {
        await compose.upAll({ ...defaultComposeArgs, log: true });

        await condition('services are ready', async () => {
            const mongoLogs = await compose.logs('mongodb', defaultComposeArgs);
            const meterLogs = await compose.logs('meter', defaultComposeArgs);
            return mongoLogs.out.includes('waiting for connections')
                && meterLogs.out.includes(' Offline [HTTP] listening')
        }, 5_000, setupTimeoutMs);

        baseUrl = 'http://' + (await compose.port('meter', 3000, defaultComposeArgs)).out.trim();
    }, setupTimeoutMs);

    afterAll(async () => {
        // print compose logs to console then destroy
        await compose.logs(['mongodb', 'meter'], { ...defaultComposeArgs, log: true });
        await compose.down({ ...defaultComposeArgs, commandOptions: ['-v'] })
    }, setupTimeoutMs);

    it('allows creation and retrieval of readings', async () => {
        const customerId = uuid.v4();

        const reading = `
        {
            "customerId": "${customerId}",
            "serialNumber": "sn",
            "mpxn": "m",
            "readDate": "2017-01-01T01:01:01Z",
            "read": [{
                "registerId": "reg",
                "type": "TYPE",
                "value": "123"
            }]
        }
        `;

        const createResponse = await fetch(`${baseUrl}/customer-reading`, {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                'accept': 'application/json',
            },
            body: reading,
        });
        expect(createResponse.status).toBe(201);
        const createResponseBody = await createResponse.json();
        expect(createResponseBody).toEqual(JSON.parse(reading));

        const findResponse = await fetch(`${baseUrl}/customer/${customerId}/meter/sn/readings?limit=1`, {
            method: 'GET',
            headers: {
                'accept': 'application/json',
            },
        });
        expect(findResponse.status).toBe(200);
        const findResponseBody = await findResponse.json();
        expect(findResponseBody).toEqual({
            results: [JSON.parse(reading)],
            paginator: { skip: 0, limit: 1 },
        });

    }, testTimeoutMs);

});