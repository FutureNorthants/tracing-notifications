var AWS = require("aws-sdk");
AWS.config.update({region:"eu-west-2"});
var NotifyClient = require('notifications-node-client').NotifyClient;
const axios = require('axios').default;
var queueUrl = process.env.QUEUE_URL;
var notifyApiKey = process.env.NOTIFY_API_KEY;
var smsTemplateId = process.env.NOTIFY_SMS_TEMPLATE_ID;
var emailTemplateId = process.env.NOTIFY_EMAIL_TEMPLATE_ID;
var numberOfMessages = process.env.NUMBER_OF_MESSAGES;
var outsystemsHost = process.env.OUTSYSTEMS_HOST;
var outsystemsPath = process.env.OUTSYSTEMS_PATH;
var outsystemsApiKey = process.env.OUTSYSTEMS_API_KEY;

exports.handler = async (event) => {
    
    var sqs = new AWS.SQS();
    var notifyClient = new NotifyClient(notifyApiKey);
    const params = {
        QueueUrl: queueUrl,
        MaxNumberOfMessages: 10,
        WaitTimeSeconds: 20
    };
    
    //get the messages
    try {
        var data = await sqs.receiveMessage(params).promise();
    } catch (err) {
        console.log(err);
        return err;
    }
    var messages = data.Messages;
    
    console.log(messages)

    var smsMessageParams = {
        personalisation: null,
        reference: data.ResponseMetadata.RequestId
    };

    var emailMessageParams = {
        personalisation: null,
        reference: data.ResponseMetadata.RequestId
    }
        //loop through the messages
    for (var i = 0; i < messages.length; i++) {
        var phone1Error;
        var phone2Error;
        var emailError;
        var phone1Success = false;
        var phone2Success = false;
        var emailSuccess = false;

        //check for phone 1
        if(JSON.parse(messages[i].Body).hasOwnProperty("Phone")){
            try {
                var result = await notifyClient.sendSms(smsTemplateId, JSON.parse(messages[i].Body).Phone, smsMessageParams);
                phone1Success = true;
            } catch (error) {
                phone1Error = error
            }
        }

        //check for phone 2
        if(JSON.parse(messages[i].Body).hasOwnProperty("Phone2")){
            try {
                var result = await notifyClient.sendSms(smsTemplateId, JSON.parse(messages[i].Body).Phone2, smsMessageParams);
                phone2Success = true;
            } catch (error) {
                phone2Error = error
            }
        }
        //check for email
        if(JSON.parse(messages[i].Body).hasOwnProperty("Email")){
            try {
                var result = await notifyClient.sendEmail(emailTemplateId, JSON.parse(messages[i].Body).Email, emailMessageParams) ;
                emailSuccess = true;
            } catch (error) {
                emailError = error
            }
        }

        //if one of the messages has successfully deleted
        if(emailSuccess === true || phone1Success === true || phone2Success === true){
            try {
                var deleteData = await sqs.deleteMessage({QueueUrl:queueUrl, ReceiptHandle:messages[i].ReceiptHandle}).promise();
            } catch (e) {
                console.log(e);
                console.log("failed delete");
                // we might want to notify someone if we can't delete
                return(e);
            }
            console.log("successful delete");
            console.log(deleteData);

            const options = {
                hostname: outsystemsHost,
                path: outsystemsPath,
                method: 'post',
                headers:{
                    "Content-Type": "application/json",
                    "caseId": JSON.parse(messages[i].Body).ContactCaseId,
                    "key": outsystemsApiKey
                }
            }

            const axiosOptions = {
                method: 'post',
                url: outsystemsHost + outsystemsPath,
                headers:{
                    "Content-Type": "application/json",
                    "caseId": JSON.parse(messages[i].Body).ContactCaseId,
                    "key": outsystemsApiKey
                }
            }
            try {
                var axiosResponse = await axios(axiosOptions)
                console.log(axiosResponse);
            } catch (error) {
                console.log(error);
            }
        }
        
    }
    
    return;
};
