const express = require('express');
const _ = require('lodash');
const bodyParser = require('body-parser');

var {mongoose} = require('./db/mongoose');
var {User} = require('./models/user');
var {authenticate} = require('./middleware/authenticate');

var port = 3000;
var app = express();

app.use(bodyParser.json());
app.use(express.static(__dirname + '/public'))

app.get('', (req, res) => {
    res.sendFile('/index.html');
})

// register user
app.post('/users', (req, res) => {
    var body = _.pick(req.body, ['email', 'password']);  
    var user = new User(body);
    user.save().then((user) => {
        return user.generateAuthToken();
    }).then((token) => {
        res.header('x-auth', token).send(user);
    }).catch((e) => {
        res.status(400).send(e);
    })  
})

// login user
app.post('/users/login', (req, res) => {
    var body = _.pick(req.body, ['email', 'password']);
    User.findByCredentials(body.email, body.password).then((user) => {
        return user.generateAuthToken().then((token) => {
            res.header('x-auth', token).send(user);
        })
    }).catch((e) => {
        res.status(400).send(e);
    })
})

app.get('/users/me', authenticate, (req, res) => {
    res.send(req.user);
})

// logout user
app.delete('/users/me/token', authenticate, (req, res) => {
    req.user.removeToken(req.token).then(() => {
        res.status(200).send();
    }, () => {
        res.status(400).send();
    });
});

app.listen(port, () => {
    console.log('Server is up on port: '+port);
})