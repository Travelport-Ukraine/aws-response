const { expect } = require('chai');
const lowercaseKeys = require('lowercase-keys');

const R = require('../lib/index');

describe('Test handling request', () => {
  it('should check if transform works correctly', (cb) => {
    const event = require('./sample-requests/GET-request-aws.json');

    const handler = R({
      transform: (data) => {
        expect(data).to.be.deep.equal(Object.assign(event.queryStringParameters, { headers: event.headers }));
        return Object.assign({}, data, { newField: 12134 });
      }
    },(data) => {
      expect(data.newField).to.be.equal(12134);
      return { response: { ok: 1 }};
    });

    handler(event, { requestId: 12345 }, (err, result) => {
      cb();
    });
  });


  it('should check if validation works correctly', (cb) => {
    const event = require('./sample-requests/GET-request-aws.json');

    const handler = R({
      validate: (data) => {
        expect(data).to.be.deep.equal(Object.assign(event.queryStringParameters, { headers: event.headers }));
        throw new Error('VALIDATION');
      }
    },(data) => {
      return { response: { ok: 1 } };
    });

    handler(event, { requestId: 12345 }, (err, result) => {
      try {
        expect(result.body).to.be.a('string');
        const body = JSON.parse(result.body);
        expect(body.errorMessage).to.be.equal('VALIDATION');
        cb();
      } catch (err) {
        cb(err);
      }
    });
  });

  it('should check if get params parsed correctly', (cb) => {
    const event = require('./sample-requests/GET-request-aws.json');

    const handler = R((data) => {
      expect(data).to.be.deep.equal(Object.assign(
        {},
        event.queryStringParameters,
        {
          path1: 'ok',
        },
        {
          authorizer: undefined,
          headers: lowercaseKeys(event.headers),
          context: { logStreamName: '1', awsRequestId: '1' }
        }
      ));
      return { response: { ok: 1 }};
    });

    handler(event, {logStreamName: '1', awsRequestId: '1'}, (err, result) => {
      try {
        expect(result).to.have.all.keys(['statusCode', 'body', 'headers']);
        expect(result.headers).to.be.an('object');
        expect(result.headers).to.have.all.keys('Access-Control-Allow-Origin');
        expect(result.statusCode).to.be.equal(200);
        expect(result.body).to.be.a('string');
        const response = JSON.parse(result.body);
        expect(response).to.be.not.null;
        expect(response).to.have.all.keys(['data', 'dataAvailable', 'executionTimeInMs', 'originalRequest', 'status', 'requestId', 'date']);
        expect(response.data.ok).to.be.equal(1);
        expect(response.originalRequest).to.be.deep.equal(
          event.queryStringParameters
        );
        expect(response.dataAvailable).to.be.equal(true);
        expect(response.executionTimeInMs).to.be.a('number');
        expect(response.status).to.be.equal('success');
        expect(response.requestId).to.be.equal('1\\1');
        cb();
      } catch (err) {
        cb(err);
      }
    });
  });

  it('should check if POST params parsed correctly', (cb) => {
    const event = require('./sample-requests/POST-request-aws.json');

    const handler = R((data) => {
      expect(data).to.be.deep.equal(Object.assign({},
        JSON.parse(event.body),
        { authorizer: undefined },
        { headers: lowercaseKeys(event.headers) },
        { context: { logStreamName: '1', awsRequestId: '1' } }
      ));
      return Promise.resolve({ response: { ok: 1 }});
    });

    handler(event, {logStreamName: '1', awsRequestId: '1'}, (err, result) => {
      try {
        expect(result).to.have.all.keys(['statusCode', 'body', 'headers']);
        expect(result.headers).to.be.an('object');
        expect(result.headers).to.have.all.keys('Access-Control-Allow-Origin');
        expect(result.statusCode).to.be.equal(200);
        expect(result.body).to.be.a('string');
        const response = JSON.parse(result.body);
        expect(response).to.be.not.null;
        expect(response).to.have.all.keys(['data', 'dataAvailable', 'executionTimeInMs', 'originalRequest', 'status', 'requestId', 'date']);
        expect(response.data.ok).to.be.equal(1);
        expect(response.originalRequest).to.be.deep.equal(
          JSON.parse(event.body)
        );
        expect(response.dataAvailable).to.be.equal(true);
        expect(response.executionTimeInMs).to.be.a('number');
        expect(response.status).to.be.equal('success');
        expect(response.requestId).to.be.equal('1\\1');
        cb();
      } catch (err) {
        cb(err);
      }
    });
  });

  it('should handle thrown error', (cb) => {
    const event = require('./sample-requests/POST-request-aws.json');

    const handler = R((data) => {
      throw Error('PANIC');
    });

    handler(event, {logStreamName: '1', awsRequestId: '1'}, (err, result) => {
      try {
        expect(result).to.have.all.keys(['statusCode', 'body', 'headers']);
        expect(result.headers).to.be.an('object');
        expect(result.headers).to.have.all.keys('Access-Control-Allow-Origin');
        expect(result.statusCode).to.be.equal(500);
        expect(result.body).to.be.a('string');
        const response = JSON.parse(result.body);
        expect(response).to.be.not.null;
        expect(response).to.have.all.keys(['errorData', 'errorMessage','errorName', 'dataAvailable', 'executionTimeInMs', 'originalRequest', 'status', 'requestId', 'date']);
        expect(response.originalRequest).to.be.deep.equal(
          JSON.parse(event.body)
        );
        expect(response.dataAvailable).to.be.equal(false);
        expect(response.executionTimeInMs).to.be.a('number');
        expect(response.status).to.be.equal('error');
        expect(response.requestId).to.be.equal('1\\1');
        cb();
      } catch (err) {
        cb(err);
      }
    });
  });

  it('should handle rejected promise', (cb) => {
    const event = require('./sample-requests/POST-request-aws.json');

    const handler = R((data) => {
      return Promise.reject('PANIC');
    });

    handler(event, {logStreamName: '1', awsRequestId: '1'}, (err, result) => {
      try {
        expect(result).to.have.all.keys(['statusCode', 'body', 'headers']);
        expect(result.headers).to.be.an('object');
        expect(result.headers).to.have.all.keys('Access-Control-Allow-Origin');
        expect(result.statusCode).to.be.equal(500);
        expect(result.body).to.be.a('string');
        const response = JSON.parse(result.body);
        expect(response).to.be.not.null;
        expect(response).to.have.all.keys(['errorData', 'errorMessage','errorName', 'dataAvailable', 'executionTimeInMs', 'originalRequest', 'status', 'requestId', 'date']);
        expect(response.originalRequest).to.be.deep.equal(
          JSON.parse(event.body)
        );
        expect(response.dataAvailable).to.be.equal(false);
        expect(response.executionTimeInMs).to.be.a('number');
        expect(response.status).to.be.equal('error');
        expect(response.requestId).to.be.equal('1\\1');
        cb();
      } catch (err) {
        cb(err);
      }
    });
  });


  it('should handle rejected error in promise', (cb) => {
    const event = require('./sample-requests/POST-request-aws.json');

    const handler = R((data) => {
      return Promise.reject(new Error('PANIC'));
    });

    handler(event, {logStreamName: '1', awsRequestId: '1'}, (err, result) => {
      try {
        expect(result).to.have.all.keys(['statusCode', 'body', 'headers']);
        expect(result.headers).to.be.an('object');
        expect(result.headers).to.have.all.keys('Access-Control-Allow-Origin');
        expect(result.statusCode).to.be.equal(500);
        expect(result.body).to.be.a('string');
        const response = JSON.parse(result.body);
        expect(response).to.be.not.null;
        expect(response).to.have.all.keys(['errorData', 'errorMessage','errorName', 'dataAvailable', 'executionTimeInMs', 'originalRequest', 'status', 'requestId', 'date']);
        expect(response.originalRequest).to.be.deep.equal(
          JSON.parse(event.body)
        );
        expect(response.dataAvailable).to.be.equal(false);
        expect(response.executionTimeInMs).to.be.a('number');
        expect(response.status).to.be.equal('error');
        expect(response.requestId).to.be.equal('1\\1');
        cb();
      } catch (err) {
        cb(err);
      }
    });
  });

  it('should return custom result (1)', (cb) => {
    const event = require('./sample-requests/GET-request-aws.json');

    const handler = R((data) => {
      expect(data).to.be.deep.equal(
        Object.assign(
          {},
          event.queryStringParameters,
          {
            path1: 'ok',
          },
          {
            authorizer: undefined,
            headers: lowercaseKeys(event.headers),
            context: { logStreamName: '1', awsRequestId: '1' },
          }
        )
      );
      return {
        response: 'test',
        custom: true,
        options: {
          isBase64Encoded: true,
          headers: {
            'Content-Type': 'image/png',
          },
        },
      };
    });

    handler(event, { logStreamName: '1', awsRequestId: '1' }, (err, result) => {
      try {
        expect(result).to.have.all.keys(['statusCode', 'body', 'headers', 'isBase64Encoded']);
        expect(result.headers).to.be.an('object');
        expect(result.headers).to.have.all.keys('Access-Control-Allow-Origin', 'Content-Type');
        expect(result.statusCode).to.be.equal(200);
        expect(result.body).to.be.a('string');
        const response = result.body;
        expect(response).to.be.not.null;
        expect(response).to.be.equal('test');
        cb();
      } catch (err) {
        cb(err);
      }
    });
  });

  it('should return custom result (2)', (cb) => {
    const event = require('./sample-requests/GET-request-aws.json');

    const handler = R((data) => {
      expect(data).to.be.deep.equal(
        Object.assign(
          {},
          event.queryStringParameters,
          {
            path1: 'ok',
          },
          {
            authorizer: undefined,
            headers: lowercaseKeys(event.headers),
            context: { logStreamName: '1', awsRequestId: '1' },
          }
        )
      );
      return {
        response: null,
        custom: true,
        options: {
          statusCode: 404,
          isBase64Encoded: true,
          headers: {
            'Content-Type': 'image/png',
          },
        },
      };
    });

    handler(event, { logStreamName: '1', awsRequestId: '1' }, (err, result) => {
      try {
        expect(result).to.have.all.keys(['statusCode', 'body', 'headers', 'isBase64Encoded']);
        expect(result.headers).to.be.an('object');
        expect(result.headers).to.have.all.keys('Access-Control-Allow-Origin', 'Content-Type');
        expect(result.statusCode).to.be.equal(404);
        expect(result.body).to.be.null;
        cb();
      } catch (err) {
        cb(err);
      }
    });
  });
});
