const lowercaseKeys = require('lowercase-keys');

const calculateExecution = endTime =>
  Math.round((endTime[0] * 1e3) + (endTime[1] / 1e6));

const isEmpty = v => v === null || v === undefined;

const extractEventData = (event) => {
  if (!event) {
    return {};
  }

  if (event.body) {
    const body = event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString() : event.body;

    return JSON.parse(body);
  }

  return event.queryStringParameters;
};

/**
 * This function is used to handle params of aws request and process them
 *
 * @callback handlerFunction
 * @param {object} data - Json parsed body or query params
 * @return {Promise}
 */

/**
 * Wrapper for function that handled aws event, context, callback
 * and returns unified response for errors and success statuses
 * @param {object} settings - Optional settings for function
 * @param {handlerFunction} handler - Handles the response
 */
function R(...params) {
  const defaultSettings = {
    validate: data => Promise.resolve(data),
    transform: data => Promise.resolve(data),
  };

  let settings;
  let handler;

  if (params.length === 2) {
    settings = params[0];
    handler = params[1];
  }

  if (params.length === 1) {
    settings = {};
    handler = params[0];
  }

  const usedSettings = Object.assign({}, defaultSettings, settings);

  return async (event, context) => {
    const startTime = process.hrtime();
    const data = extractEventData(event);

    let transformed = null;

    try {
      transformed = await usedSettings.transform(data);
      await usedSettings.validate(data);
      // calling handler for function
      const {
        response,
        status = 'success',
        custom = false,
        options = {},
      } = await handler({
        ...data,
        ...event.pathParameters,
        context,
        headers: lowercaseKeys(event.headers),
        authorizer: event.requestContext && event.requestContext.authorizer,
      });

      const { headers = {}, ...args } = options;

      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          ...headers,
        },
        body: custom
          ? response
          : JSON.stringify({
            status,
            date: new Date(),
            requestId: `${context.logStreamName}\\${context.awsRequestId}`,
            dataAvailable: !isEmpty(response),
            executionTimeInMs: calculateExecution(process.hrtime(startTime)),
            originalRequest: transformed,
            data: response,
          }),
        ...args,
      };
    } catch (err) {
      return {
        statusCode: err.statusCode || 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          ...(err.headers ? err.headers : null),
        },
        body: JSON.stringify({
          status: 'error',
          date: new Date(),
          requestId: `${context.logStreamName}\\${context.awsRequestId}`,
          dataAvailable: false,
          executionTimeInMs: calculateExecution(process.hrtime(startTime)),
          originalRequest: transformed,
          errorMessage: err.message || 'Unknown error. No error message',
          errorName: err.name || 'UnknownError',
          errorData: err.data ? err.data : null,
        }),
      };
    }
  };
}

module.exports = R;
