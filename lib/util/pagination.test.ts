import {Pagination, defaultLimit} from './pagination';

describe('Pagination', () => {

    describe('constructor', () => {

        it('sets given limit and skip values', () => {
            const pagination = new Pagination(100, 200);
            expect(pagination.skip).toBe(200);
            expect(pagination.limit).toBe(100);
        });

        it('creates initial page when skip not specified', () => {
            const pagination = new Pagination(100);
            expect(pagination.skip).toBe(0);
            expect(pagination.limit).toBe(100);
        });

        it('creates initial page of default size when skip and limit not specified', () => {
            const pagination = new Pagination();
            expect(pagination.skip).toBe(0);
            expect(pagination.limit).toBe(defaultLimit);
        });

    });

    describe('nextPage', () => {

        it('returns the Paginator for the next page', () => {
            const next = new Pagination(100, 200).nextPage();
            expect(next.limit).toBe(100);
            expect(next.skip).toBe(300);
        })

    });

});
