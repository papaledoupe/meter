// This module represents business invariants defined in the domain

export class InvariantBrokenError extends Error {
    constructor(message: string) {
        super(message)
    }
}

export function invariant(message: string, conditionMet: boolean) {
    if (!conditionMet) {
        throw new InvariantBrokenError(message)
    }
}

type Predicate<T> = (subject: T) => boolean

export const notBlank: Predicate<string> = str => str.trim().length > 0;
export const notEmpty: Predicate<any[]> = arr => arr.length > 0;
