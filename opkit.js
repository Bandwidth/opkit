/*
OPKIT v0.0.1 2016-05-12
Illirik Smirnov (ismirnov@bandwidth.com)
Ram Rao (rrao@bandwidth.com)

A framework to help you build devops bots
(but only if you're deployed to AWS and talking in Slack)
*/

var Botkit = require('botkit');
var AWS = require('aws-sdk');

//Functions that allow you to update the authorization keys (both at a time or each at once)
function updateAuthKeys(accessKeyId, secretAccessKey){
    AWS.config.update({
        accessKeyId: accessKeyId, 
        secretAccessKey: secretAccessKey
    });
}

function updateAccessKeyId(accessKeyId){
    AWS.config.update({
        accessKeyId: accessKeyId
    });
}

function updateSecretAccessKey(secretAccessKey){
    AWS.config.update({
        secretAccessKey: secretAccessKey
    });
}

//Functions that allow you to update the AWS region from which you are querying
function updateRegion(targetRegion){
    AWS.config.update({
        region: targetRegion
    });
}