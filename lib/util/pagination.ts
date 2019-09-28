export const defaultLimit = 200;

export class Pagination {
    readonly skip: number;
    readonly limit: number;

    constructor(limit: number = defaultLimit, skip: number = 0) {
        this.skip = skip;
        this.limit = limit;
    }

    nextPage(): Pagination {
        return new Pagination(this.limit, this.skip + this.limit);
    }
}