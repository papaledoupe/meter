// Runs integration and unit tests
module.exports = {
    "roots": [
        "<rootDir>/src"
    ],
    "transform": {
        "^.+\\.ts$": "ts-jest"
    },
    testRegex: "(\\.|/)(test|it)\\.ts?$"
};