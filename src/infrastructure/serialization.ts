import {CustomerReading} from '../domain/customer';
import moment from 'moment';

export class SerializationError extends Error {}

export const requireProperty = (object: object, key: string): any => {
    if (!object.hasOwnProperty(key)) {
        throw new SerializationError(`${key} is required`)
    }
    return object[key];
};

export const requireArray = (object: object, key: string): any[] => {
    const prop = requireProperty(object, key);
    if (!Array.isArray(prop)) {
        throw new SerializationError(`${key} must be an array`)
    }
    return object[key]
};

export const requireString = (object: object, key: string): string => {
    const prop = requireProperty(object, key);
    if (typeof prop !== 'string') {
        throw new SerializationError(`${key} must be a string`)
    }
    return object[key]
};

export const optionalInt = (object: object, key: string): number | null => {
    if (!object.hasOwnProperty(key)) {
        return null
    }
    const val = object[key];
    const intVal = parseInt(val, 10);
    if (isNaN(intVal)) {
        return null;
    }
    return intVal;
};

export const dateFormat = "YYYY-MM-DDTHH:mm:ssZZ[Z]";

export const requireMoment = (object: object, key: string): moment.Moment => {
    const str = requireString(object, key);
    const mom = moment.parseZone(str, dateFormat, true);
    if (!mom.isValid()) {
        throw new SerializationError(`${key} must be in format ${dateFormat}`)
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