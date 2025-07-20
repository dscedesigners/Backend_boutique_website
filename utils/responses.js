export function success(res, data, message = 'Success', statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
}

export function error(res, message = 'Internal Server Error', statusCode = 500, errors = null) {
  return res.status(statusCode).json({
    success: false,
    message,
    errors
  });
}

export function validationError(res, errors) {
  return res.status(400).json({
    success: false,
    message: 'Validation failed',
    errors
  });
}