// Runs all tests.
module.exports = {
    "roots": [
        "<rootDir>/lib"
    ],
    "transform": {
        "^.+\\.ts$": "ts-jest"
    },
    testRegex: "(\\.|/)(test|it)\\.ts?$"
};