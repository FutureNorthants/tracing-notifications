var AWS = require("aws-sdk");
AWS.config.update({region:"eu-west-2"});
var stateMachineArn = process.env.STATE_MACHINE_ARN;

exports.handler = async (event) => {
    //find out if the machine is running
    var stepfunctions = new AWS.StepFunctions();
    var params = {
        "stateMachineArn": stateMachineArn,
        statusFilter: "RUNNING"
    }
    try {
        var res = await stepfunctions.listExecutions(params).promise();
        console.log(res);
    } catch (error) {
        console.log(error);
    }

    //set it to run
    if(res.executions.length === 0){
        params = {
            "stateMachineArn": stateMachineArn
        }
        try {
            var data = await stepfunctions.startExecution(params).promise();
            console.log(data)
        } catch (error) {
            console.log(error)
        }
    }
    return {
        statusCode: 200
    };
}