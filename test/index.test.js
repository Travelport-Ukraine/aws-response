const { expect } = require('chai');
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
      return { ok: 1 };
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
      return { ok: 1 };
    });

    handler(event, { requestId: 12345 }, (err, result) => {
      expect(result.body).to.be.a('string');
      const body = JSON.parse(result.body);
      expect(body.errorMessage).to.be.equal('VALIDATION');
      cb();
    });
  });

  it('should check if get params parsed correctly', (cb) => {
    const event = require('./sample-requests/GET-request-aws.json');

    const handler = R((data) => {
      expect(data).to.be.deep.equal(Object.assign(
        {}, event.queryStringParameters, { authorizer: undefined, headers: event.headers }));
      return { ok: 1 };
    });

    handler(event, {logStreamName: '1', awsRequestId: '1'}, (err, result) => {
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
    });
  });

  it('should check if POST params parsed correctly', (cb) => {
    const event = require('./sample-requests/POST-request-aws.json');

    const handler = R((data) => {
      expect(data).to.be.deep.equal(Object.assign({},
        JSON.parse(event.body),
        { authorizer: undefined },
        { headers: event.headers }
      ));
      return Promise.resolve({ ok: 1 });
    });

    handler(event, {logStreamName: '1', awsRequestId: '1'}, (err, result) => {
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
    });
  });

  it('should handle thrown error', (cb) => {
    const event = require('./sample-requests/POST-request-aws.json');

    const handler = R((data) => {
      throw Error('PANIC');
    });

    handler(event, {logStreamName: '1', awsRequestId: '1'}, (err, result) => {
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
    });
  });

  it('should handle rejected promise', (cb) => {
    const event = require('./sample-requests/POST-request-aws.json');

    const handler = R((data) => {
      return Promise.reject('PANIC');
    });

    handler(event, {logStreamName: '1', awsRequestId: '1'}, (err, result) => {
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
    });
  });


  it('should handle rejected error in promise', (cb) => {
    const event = require('./sample-requests/POST-request-aws.json');

    const handler = R((data) => {
      return Promise.reject(new Error('PANIC'));
    });

    handler(event, {logStreamName: '1', awsRequestId: '1'}, (err, result) => {
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
    });
  });
});
