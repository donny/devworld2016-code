exports.helloMessage = function helloMessage(req, res) {
    var name;
    switch (req.get('content-type')) {
        case 'application/json': // '{"name":"John"}'
            name = req.body.name;
            break;
        case 'text/plain': // 'John'
            name = req.body;
            break;
        case 'application/x-www-form-urlencoded': // 'name=John'
            name = req.body.name;
            break;
    }

    res.status(200).send('Hallo ' + (name || 'World') + '!');
};
