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
 * @param {handlerFunction} handler - Handles the response
 */
function R(handler) {
  return (event, context, callback) => {
    const startTime = process.hrtime();
    const data = event && event.body
      ? JSON.parse(event.body)
      : event.queryStringParameters || {};

    // calling handler for function
    let result;
    try {
      result = handler(data);
    } catch (e) {
      result = Promise.reject(e);
    }

    Promise.resolve(result)
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
            originalRequest: data,
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
            originalRequest: data,
            errorMessage: err.message || 'Unknown error. No error message',
            errorName: err.name || 'UnknownError',
            errorData: err.data ? err.data : null,
          }),
        });
      });
  };
}

module.exports = R;
