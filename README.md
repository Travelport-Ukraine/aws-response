# AWS-Response

## Purpose

Lib for handling aws requests in single way

### Use

Include to your project as git dependency

Use default exported function in next way

```
const R = required('aws-response');

module.exports.lambda = R((data) => {
    return { ok: true }; // = 200 status
    
    // or
    // return Promise.resolve({ ok: true }); // = 200 status
    
    // or
    // return Promise.reject(new Error('Some error')); // = 500 status and correct errorMessage
    
    // or
        // return Promise.reject({ data:false }); // = 500 status and UnkownError name and message
    
    // or
    // throw Error('Some error'); // will be handled as error and status = 500
});
```

`data` object in function handler contains next fields:
- `headers` - all headers from api gateway
- `context` - context of current executed function
- `authorizer` - data from authorizer.

Using this fields in post/get params if forbidden.

Also it's possible to pass `handler` as second param and `settings` object as first.

Default `settings` fields:
```
const defaultSettings = {
    transform: data => data, // called first 
    validate: data => data,  // than validate and after validation handler is called
}
```

## Responses

All responses have next shape and returned in compatible format with AWS Lambda proxy integration

```
{
    statusCode: 200 || 500,
    header: { Access-Control-Allow-Origin: '*' },
    body: 'string'
}
```

### Success body
 
```
{
  "data": {
    "ok": 1
  }, 
  "dataAvailable": true, 
  "executionTimeInMs": 6, 
  "originalRequest": {
    "param1": "ok", 
    "param2": "okok"
  }, 
  "requestId": 12345, 
  "status": "success"
}
```

### Error body

```
{
  "dataAvailable": false, 
  "errorData": null, 
  "errorMessage": "PANIC", 
  "errorName": "Error", 
  "executionTimeInMs": 4, 
  "originalRequest": {
    "data": "ok", 
    "param2": "2"
  }, 
  "requestId": 12345, 
  "status": "error"
}
```

### Development

Please check package.json for commands.

Be sure that `npm test` and `npm run lint` passes.
