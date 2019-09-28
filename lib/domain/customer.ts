import {MeterReading, validateMeterReading} from './reading';
import {invariant, notBlank} from './invariant';

// CustomerMeter uniquely identifies a meter used by a customer.
// - while customerId is globally unique, do not rely on serialNumber being unique.
// - a meter identified by a serialNumber may (presumably) be reused by a number of different customers.
export type CustomerMeter = {
    customerId: string
    serialNumber: string
}

export function validateCustomerMeter(customerMeter: CustomerMeter) {
    const { customerId, serialNumber } = customerMeter;
    invariant('customerId must not be blank', notBlank(customerId));
    invariant('serialNumber must not be blank', notBlank(serialNumber));
}

// CustomerSupply uniquely identifies a supply point used by a customer.
export type CustomerSupply = {
    customerId: string
    mpxn: string
}

export function validateCustomerSupply(customerSupply: CustomerSupply) {
    const { customerId, mpxn } = customerSupply;
    invariant('customerId must not be blank', notBlank(customerId));
    invariant('mpxn must not be blank', notBlank(mpxn));
}

export type CustomerReading = CustomerMeter & CustomerSupply & MeterReading;

export function validateCustomerReading(customerReading: CustomerReading) {
    validateCustomerMeter(customerReading);
    validateCustomerSupply(customerReading);
    validateMeterReading(customerReading);
}
