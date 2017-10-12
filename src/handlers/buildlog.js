'use strict';

const console = require('console');
const AWS = require('aws-sdk');
const codebuild = new AWS.CodeBuild({
    apiVersion: '2016-10-06'
});
const s3 = new AWS.S3({
    apiVersion: '2006-03-01'
});
const bucketName = process.env.SLSDEPLOY_LOGS_S3_BUCKET_NAME;
const serviceRole = `${process.env.SLSDEPLOY_SERVICE_NAME}-${process.env.SLSDEPLOY_STAGE}-${process.env.SLSDEPLOY_REGION}-CodeBuildIamRole`;
const buildLogLocationPrefix = 'logs/';

module.exports.post = (event, context, callback) => {
    const hash = decodeURIComponent(event.pathParameters.hash);
    const buildId = event.headers['X-Codebuild-Build-Id'];
    const data = {
        buildId: buildId,
        hash: hash,
        out: event.body
    };
    
    const params = {
        Bucket: bucketName,
        Key: `${buildLogLocationPrefix}${hash}.json`,
        Body: JSON.stringify(data, null, 2),
        ContentType: 'application/json'
    };

    // TODO: Check X-CodeBuild-Build-Id
    
    s3.putObject(params).promise()
        .then(() => {
            const response = {
                statusCode: 200,
                headers: {
                    'Content-Type': 'text/html'
                },
                body: 'OK'
            };
            callback(null, response);
        })
        .catch((err) => {
            console.error(err);
            const response = {
                statusCode: 500,
                headers: {
                    'Content-Type': 'text/html'
                },
                body: 'Internal Server Error'
            };
            callback(null, response);
        });
};

module.exports.get = (event, context, callback) => {
    console.log(event);
    console.log(context);
    const response = {
        statusCode: 200,
        headers: {
        },
        body: `ok`
    };
    callback(null, response);
};
