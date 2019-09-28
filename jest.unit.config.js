// Runs only unit tests (*.test.ts).
module.exports = {
    ...(require('./jest.config')),
    testRegex: "(\\.|/)(test)\\.ts?$"
};