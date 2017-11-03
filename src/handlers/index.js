'use strict';

const ejs = require('ejs');
const fs = require('fs');
const stage = process.env.SLSDEPLOY_STAGE;

module.exports.handler = (event, context, callback) => {
    const data = {
        host: event.headers.Host,
        stage: stage
    };

    const response = {
        statusCode: 200,
        headers: {
            'Content-Type': 'text/html'
        },
        body: ejs.render(fs.readFileSync(__dirname + '/../templates/index.html').toString('utf-8'), data)
    };
    callback(null, response);
};
