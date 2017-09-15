'use strict';

const ejs = require('ejs');
const fs = require('fs');

module.exports.handler = (event, context, callback) => {
    const hash = decodeURIComponent(event.pathParameters.hash);
    
    const data = {
        hash: hash
    };
    
    const response = {
        statusCode: 200,
        headers: {
            'Content-Type': 'text/html'
        },
        body: ejs.render(fs.readFileSync(__dirname + '/deploying.html').toString('utf-8'), data)
    };
    callback(null, response);
};
