# AWS-Response – ABANDONED

Please use https://github.com/middyjs/middy or any other better lib.

## Purpose

Lib for handling aws requests in single way

### Use

Include to your project as git dependency

Use default exported function in next way

```javascript
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
    
    // or
    // const e = new Error('Not found');
    // e.statusCode = 404;
    // e.headers = { 'NotFoundToken': 12345 }
    // throw e;
});
```

`data` object in function handler contains next fields:
- `headers` - all headers from api gateway
- `context` - context of current executed function
- `authorizer` - data from authorizer.

Using this fields in post/get params if forbidden.

Also it's possible to pass `handler` as second param and `settings` object as first.

Default `settings` fields:

```javascript
const defaultSettings = {
    transform: data => data, // called first 
    validate: data => data,  // than validate and after validation handler is called
}
```

## Responses

All responses have next shape and returned in compatible format with AWS Lambda proxy integration

```javascript
{
    statusCode: 200 || 500,
    header: { Access-Control-Allow-Origin: '*' },
    body: 'string'
}
```

### Success body
 
```javascript
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

```javascript
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

### Custom body
To achieve customization of the response provide these additional parameters from your lambda function:
| Name        | Default           | Description  |
| ------------- |-------------| -----|
| custom     | `false` | Flag to enable custom body response |
| options      | `{}`      |   Custom options such as additional heders, `isBase64Encoded`, `statusCode` or any another options you might need |

Please, make sure to have your `response` as a string and `custom` option is provided.

#### Example

```javascript
// labmda.js
const R = require('aws-response');

function demo() {
  // ...
  const buffer = Buffer.from('Your image data');

  return {
    custom: true,
    options: {
      isBase64Encoded: true,
      headers: {
        'Content-Type': 'image/png',
      },
      response: buffer.toString('base64'),
      statusCode: 200,
    },
  };
}

exports.handler = R(demo);
```


### Development

Please check package.json for commands.

Be sure that `npm test` and `npm run lint` passes.
