// Runs only integration tests (*.it.ts).
module.exports = {
    ...(require('./jest.config')),
    testRegex: "(\\.|/)(it)\\.ts?$"
};