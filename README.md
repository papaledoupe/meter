# meter

Coding exercise to build a service that accepts electricity/gas meter readings.

## Tech stack

Typescript compiled to JS and deployed to a serverless environment using nodejs.
MongoDB is used for persistence.
Docker + docker-compose + serverless-offline are used to create a self-contained component testing environment.

## Running

To run serverless commands you can use `npm run sls -- [args]`.

You can test the functions out by running them with `invoke local` using the example requests given in the `examples` directory.
You will need to run a mongodb instance, e.g. `docker run [args] mongo:3.3`.

Example:
```shell
$ docker run -p 27017:27017 -d mongo:3.3
$ npm run sls -- invoke local --function write --path examples/write.json --env MONGO_URL=mongodb://0.0.0.0:27017/meterdb
>
> webpack guff...
>
> {
>     "statusCode": 201,
>     "body": "{\"customerId\":\"identifier123\",\"serialNumber\":\"27263927192\",\"mpxn\":\"14582749\",\"read\":[{\"registerId\":\"387373\",\"type\":\"ANYTIME\",\"value\":\"2729\"},{\"registerId\":\"387373\",\"type\":\"NIGHT\",\"value\":\"2892\"}],\"readDate\":\"2017-11-20T16:19:48Z\"}",
>     "headers": {
>         "content-type": "application/json"
>     }
> }
```

You can use serverless-offline to run it as a process with an emulated API gateway for testing the HTTP interface: 
```shell
session1$ docker run -p 27017:27017 -d mongo:3.3
session1$ MONGO_URL=mongodb://0.0.0.0:27017/meterdb npm run sls -- offline
        > wait for it to start...
session2$ curl -XPOST http://localhost:3000/customer-reading -H'content-type: application/json' -d '{}'
        > {"error":"customerId is required"}
```

## Testing

- Comprehensive unit tests for fast feedback
- Integration tests using in-memory mongodb ([mongo-unit](https://www.npmjs.com/package/mongo-unit)) for testing integration between repository code and persistent store.
- Out of process component tests orchestrated by docker-compose with function running in serverless-offline environment and real mongodb 

To run various test targets:
- unit: `npm run unit-test [ -- jest args]`
- integration: `npm run integration-test [ -- jest args]`
- unit + integration: `npm run test [ -- jest args]`
- component: `npm run component-test [ -- jest args]`

Both unit and integration tests are in-process and can generate a coverage report using `npm run coverage [ -- jest args]`.

## API

Skimping a bit here as I don't have time to write a proper API spec e.g. swagger / API blueprint!

### Functions

#### write (HTTP: POST /customer-reading)

Record a new reading. Body in the format:
```json
{
	"customerId": "identifier123",
	"serialNumber": "27263927192",
	"mpxn": "14582749",
	"read": [{
		"type": "ANYTIME",
		"registerId": "387373",
		"value": "2729"
	}],
	"readDate": "2017-11-20T16:19:48+00:00"
}
```
Notes:
- at least one read value is required
- readDate must be specified exactly as shown: an ISO 8601 zoned date time without fractional seconds

Response codes:
- 201 with created reading as body
- 400 with error message when bad request (missing JSON fields, invalid data types, etc.)
- 409 with error message when business logic conflict error (no readings given, identifiers empty etc.)
- 500 with error message when unexpected error occurs

#### readByMeter (HTTP: GET /customer/{customerId}/meter/{serialNumber}[?limit=N,skip=M])

Retrieve readings for a customer at a particular meter.

Response in the format:
```json
{
	"results": [{
		"customerId": "identifier123",
		"serialNumber": "27263927192",
		"mpxn": "14582749",
		"read": [{
			"type": "ANYTIME",
			"registerId": "387373",
			"value": "2729"
		}],
		"readDate": "2017-11-20T16:19:48+00:00"
	}],
	"paginator": {
		"limit": 200,
		"skip": 0
	}
}
```

Limit/offset-style pagination is supported. Results are sorted by most recent readDate.
You can specify limit and skip as query parameters to page through the results. 

Response codes:
- 200, even if there are no results (the resource is a collection which implicitly exists but may be empty)
- 500 if an unexpected error occurs

#### readBySupply (HTTP: GET /customer/{customerId}/supply/{mpxn}[?limit=N,skip=M])

As with readByMeter, but allows you to query by the customer ID and a specific supply point instead of meter.