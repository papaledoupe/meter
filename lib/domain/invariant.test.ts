import {invariant, InvariantBrokenError, notBlank, notEmpty} from './invariant';

describe('invariant', () => {

    describe('invariant', () => {

        it('throws InvariantBrokenError when condition not met', () => {
            expect(() => invariant('msg', false)).toThrow(InvariantBrokenError);
        });

        it('throws error with given message when condition not met', () => {
            expect(() => invariant('msg', false)).toThrow('msg');
        });

        it('does not throw when condition met', () => {
            invariant('msg', true);
        })

    });

    describe('notBlank', () => {

        it.each`
        str
        ${''}
        ${' '}
        ${'\n'}
        ${'\t'}
        `('returns false when string is blank (string: "$str")', ({ str }) => {
            expect(notBlank(str)).toBe(false);
        });

    });

    describe('notEmpty', () => {

        it('returns false when array is empty', () => {
            expect(notEmpty([])).toBe(false);
        });

        it('returns true when array is not empty', () => {
            expect(notEmpty([1])).toBe(true);
        });

    });

});