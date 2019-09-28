export const defaultLimit = 200;

export class Paginator {
    readonly skip: number;
    readonly limit: number;

    constructor(limit?: number, skip?: number) {
        this.skip = skip || 0;
        this.limit = limit || defaultLimit;
    }

    ofNextPage(): Paginator {
        return new Paginator(this.limit, this.skip + this.limit);
    }

    // Create a page of results from the results of this cursor.
    createPage<T>(results: T[]): Page<T> {
        return new Page(results, this);
    }
}

export class Page<T> {
    readonly results: T[];
    readonly paginator: Paginator;

    constructor(results: T[], paginator: Paginator) {
        this.results = results;
        this.paginator = paginator;
    }
}
