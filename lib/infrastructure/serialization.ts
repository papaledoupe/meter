import {CustomerReading} from '../domain/customer';
import moment from 'moment';

export class BadRequestError extends Error {}

const requireProperty = (object: object, key: string): any => {
    if (!object.hasOwnProperty(key)) {
        throw new BadRequestError(`${key} is required`)
    }
    return object[key];
};

const requireArray = (object: object, key: string): any[] => {
    const prop = requireProperty(object, key);
    if (!Array.isArray(prop)) {
        throw new BadRequestError(`${key} must be an array`)
    }
    return object[key]
};

const requireString = (object: object, key: string): string => {
    const prop = requireProperty(object, key);
    if (typeof prop !== 'string') {
        throw new BadRequestError(`${key} must be a string`)
    }
    return object[key]
};

export const dateFormat = "YYYY-MM-DDTHH:mm:ssZZ[Z]";

const requireMoment = (object: object, key: string): moment.Moment => {
    const str = requireString(object, key);
    const mom = moment.parseZone(str, dateFormat, true);
    if (!mom.isValid()) {
        throw new BadRequestError(`${key} must be in format ${dateFormat}`)
    }
    return mom;
};

export function parseCustomerReading(payload: string): CustomerReading {
    const obj = JSON.parse(payload);
    return {
        customerId: requireString(obj, 'customerId'),
        serialNumber: requireString(obj, 'serialNumber'),
        mpxn: requireString(obj, 'mpxn'),
        read: requireArray(obj, 'read').map(element => ({
            registerId: requireString(element, 'registerId'),
            type: requireString(element, 'type'),
            value: requireString(element, 'value'),
        })),
        readDate: requireMoment(obj, 'readDate'),
    }
}