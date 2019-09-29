import {CustomerReading} from '../domain/customer';
import * as dateFns from 'date-fns';

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

// Date format in the specification has no fractional seconds.
export const dateFormat = "yyyy-MM-dd'T'HH:mm:ssXXX";

// Standard JS Date serialization includes the fractional seconds, this is hack to remove them :)
const dateToJSON = Date.prototype.toJSON;
Date.prototype.toJSON = function(key?: any): string {
    const standard = dateToJSON.call(this, key);
    return standard.replace(/\.[0-9]{3}/, '');
};

export const requireDate = (object: object, key: string): Date => {
    const str = requireString(object, key);
    const date = dateFns.parse(str, dateFormat, new Date());
    if (isNaN(date.getTime())) {
        throw new SerializationError(`${key} must be in format ${dateFormat}`)
    }
    return date;
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
        readDate: requireDate(obj, 'readDate'),
    }
}