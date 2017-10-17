'use strict';

const ejs = require('ejs');
const fs = require('fs');
const stage = process.env.SLSDEPLOY_STAGE;
const bucketName = process.env.SLSDEPLOY_LOGS_S3_BUCKET_NAME;

module.exports.handler = (event, context, callback) => {
    const hash = decodeURIComponent(event.pathParameters.hash);

    const data = {
        stage,
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
