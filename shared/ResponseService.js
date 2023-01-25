// General response without a payload
exports.generalResponse = function(res, message = 'Success', status = 200) {
    res.status(status).json({
        status: status,
        msg: message
    });
};

exports.generalErrorResponse = function(res, message) {
    res.status(400).json({
        status: 400,
        msg: message
    });
};

exports.generalErrorPayloadResponse = function(res, err, message) {
    res.status(400).json({
        status: 400,
        msg: message || err.message || 'Something went wrong',
        error: err
    });
};


// General response with a payload
exports.generalPayloadResponse = function(res, payload, message = 'Success', status = 200) {
    res.status(status).json({
        status: status,
        msg: message,
        data: payload
    });
};