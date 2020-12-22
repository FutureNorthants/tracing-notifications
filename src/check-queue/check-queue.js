var AWS = require("aws-sdk");
AWS.config.update({region:"eu-west-2"});
var queueUrl = process.env.QUEUE_URL;

exports.handler = async (event) => {
    var sqs = new AWS.SQS();
    const params = {
        QueueUrl: queueUrl,
        AttributeNames: ['ApproximateNumberOfMessages']
    };

    // instead of getting messages we need to check how many messages there are in the queue
    // https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/SQS.html#getQueueAttributes-property
    
    //get the messages
    try {
        var data = await sqs.getQueueAttributes(params).promise();
    } catch (err) {
        console.log(err);
        return err;
    }
    
    console.log(data);

    if(data.Attributes.ApproximateNumberOfMessages != 0){
        return false;
    }

    return true;
};
