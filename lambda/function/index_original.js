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
