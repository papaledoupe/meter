import {Paginator, defaultLimit} from './pagination';

describe('Paginator', () => {

    describe('constructor', () => {

        it('sets given limit and skip values', () => {
            const paginator = new Paginator(100, 200);
            expect(paginator.skip).toBe(200);
            expect(paginator.limit).toBe(100);
        });

        it('creates initial page with size when skip not specified', () => {
            const paginator = new Paginator(100);
            expect(paginator.skip).toBe(0);
            expect(paginator.limit).toBe(100);
        });

        it('creates initial page with size when skip specified as null', () => {
            const paginator = new Paginator(100, null);
            expect(paginator.skip).toBe(0);
            expect(paginator.limit).toBe(100);
        });

        it('creates initial page of default size when skip and limit not specified', () => {
            const paginator = new Paginator();
            expect(paginator.skip).toBe(0);
            expect(paginator.limit).toBe(defaultLimit);
        });

        it('creates initial page of default size when skip and limit specified as null', () => {
            const paginator = new Paginator(null, null);
            expect(paginator.skip).toBe(0);
            expect(paginator.limit).toBe(defaultLimit);
        });

    });

    describe('ofNextPage', () => {

        it('returns the Paginator for the next page', () => {
            const next = new Paginator(100, 200).ofNextPage();
            expect(next.limit).toBe(100);
            expect(next.skip).toBe(300);
        })

    });

});
