const calculateExecution = endTime =>
  Math.round((endTime[0] * 1e3) + (endTime[1] / 1e6));

const isEmpty = v => v === null || v === undefined;


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
    [settings, handler] = params;
  }

  if (params.length === 1) {
    [handler] = params;
    settings = {};
  }

  const usedSettings = Object.assign({}, defaultSettings, settings);

  return (event, context, callback) => {
    const startTime = process.hrtime();
    const data = event && event.body
      ? JSON.parse(event.body)
      : event.queryStringParameters || {};

    // calling handler for function
    let transformed;

    Promise.resolve(usedSettings.transform(data))
      .then(usedSettings.validate)
      .then((transformedData) => {
        transformed = transformedData;
        return handler(transformedData);
      })
      .then((response) => {
        callback(null, {
          statusCode: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
          },
          body: JSON.stringify({
            status: 'success',
            requestId: context.requestId,
            dataAvailable: !isEmpty(response),
            executionTimeInMs: calculateExecution(process.hrtime(startTime)),
            originalRequest: transformed,
            data: response,
          }),
        });
      })
      .catch((err) => {
        callback(null, {
          statusCode: 500,
          headers: {
            'Access-Control-Allow-Origin': '*',
          },
          body: JSON.stringify({
            status: 'error',
            requestId: context.requestId,
            dataAvailable: false,
            executionTimeInMs: calculateExecution(process.hrtime(startTime)),
            originalRequest: transformed,
            errorMessage: err.message || 'Unknown error. No error message',
            errorName: err.name || 'UnknownError',
            errorData: err.data ? err.data : null,
          }),
        });
      });
  };
}

module.exports = R;
