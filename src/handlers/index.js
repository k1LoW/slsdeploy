'use strict';

module.exports.handler = (event, context, callback) => {
    const response = {
        statusCode: 200,
        headers: {
            'Content-Type': 'text/html'
        },
        body: '<h1>slsdeploy</h1>'
    };
    callback(null, response);
};
