# Lambda

# Preparation
Show AWS Lambda web console
export AWS_PROFILE=''
export AWS_REGION='east-1'

# First example
1. Go to the Lambda console, create a new function called `devWorldLambda` (skip the blueprint selection).
2. Configure with API Gateway trigger
API name: devWorldService
Resource name: /test
Method: POST
Deployment: prod
Security: Open
Function name: devWorldLambda
Code

exports.handler = function(event, context) {
 var operation = event.operation;
 switch (operation) {
	case 'ping':
	  context.succeed('pong');
	  break;
	default:
	  context.fail(new Error('Error'));
 }
};

Role: existing role: lambda_basic_execution

3. Select `Node.js` as the runtime, enter `index.handler` as the handler, select `128` as the memory size, and set the timeout to three seconds.
4. You'll get the following endpoint: https://execute-api.us-east-1.amazonaws.com/prod/test
5. Test it with curl:

curl -X POST https://execute-api.us-east-1.amazonaws.com/prod/test -H "Accept: application/json" -d '{"operation":"ping"}'



6. Show the `function` folder and upload code from terminal
