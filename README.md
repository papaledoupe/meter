# meter

Coding exercise to build a service that accepts electricity/gas meter readings.

## Tech stack

Typescript compiled to JS and deployed to a serverless environment using nodejs.
MongoDB is used for persistence.

## Code structure

TODO

## Running

TODO

## Testing

- Comprehensive unit tests for fast feedback
- Integration tests using in-memory mongodb ([mongo-unit](https://www.npmjs.com/package/mongo-unit)) for testing integration between repository code and persistent store.
- Component tests with function running in local serverless environment

To run all/unit/integration tests:
`npm run [ test | unit-test | integration-test ] [ -- jest args ]`

To generate code coverage:
`npm run coverage [ -- jest args ]`

To run component tests:
TODO