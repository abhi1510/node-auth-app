const mongoose = require('mongoose');
const validator = require('validator');
const _ = require('lodash');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

var UserSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        trim: true,
        minlength: 1,
        unique: true,
        validate: {
            validator: (value) => {
                return validator.isEmail(value)
            },
            message: '{VALUE} is not a valid email'
        }
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    tokens: [{
        access: {
            type: String,
            required: true
        },
        token: {
            type: String,
            required: true
        }        
    }]
});

// Instance method gets called with the individual document
// Instance method overriden
UserSchema.methods.toJSON = function() {
    var user = this;
    var userObj = user.toObject();
    return _.pick(userObj, ['_id', 'email']);
}

// Instance method
UserSchema.methods.generateAuthToken = function() {
    var user = this;
    var access = 'auth';
    // jwt.sign takes two args: data object and secret
    var token = jwt.sign({_id: user._id.toHexString(), access}, 'abc123').toString();
    user.tokens.push({ access, token });
    return user.save().then(() => {
        return token;
    });
}

UserSchema.statics.findByCredentials = function(email, password) {
    var User = this;
    return User.findOne({email}).then((user) => {
        if(!user) {
            return Promise.reject('Email does not exists');
        }
        return new Promise((resolve, reject) => {
            bcrypt.compare(password, user.password, (err, res) => {
                if(res) {
                    resolve(user);
                } else {
                    reject('Password does not match');
                }                
            })
        })
    })
}

UserSchema.methods.removeToken = function(token) {
    var user = this;
    return user.update({
        $pull: {
            tokens: {token}
        }
    })
}


// model method gets called with the Model as this binding
// model method
UserSchema.statics.findByToken = function(token) {
    var User = this;
    var decoded;
    try {
        // verify takes 2 args: token to be decoded and the secret
        decoded = jwt.verify(token, 'abc123');
    } catch(e) {
        // this returns a promise that always rejects
        // return new Promise((resolve, reject) => {
        //     return reject;
        // });
        return Promise.reject() // shortcut for always rejecting
    }
    return User.findOne({
        _id: decoded._id,
        'tokens.access': 'auth',
        'tokens.token': token
    })
}

UserSchema.statics.findByCredentials = function(email, password) {
    var User = this;
    return User.findOne({email}).then((user) => {
        if(!user) {
            return Promise.reject('Email does not exists');
        }
        return new Promise((resolve, reject) => {
            bcrypt.compare(password, user.password, (err, res) => {
                if(res) {
                    resolve(user);
                } else {
                    reject('Password does not match');
                }                
            })
        })
    })
}

// mongoose middleware to manipulate data before saving to db
// here we are salting and hashing the password
UserSchema.pre('save', function(next){
    var user = this;
    if(user.isModified('password')) {
        bcrypt.genSalt(10, (err, salt) => {
            bcrypt.hash(user.password, salt, (err, hash) => {
                user.password = hash;
                next();
            });
        });
    } else {
        next();
    }
})

var User = mongoose.model('User', UserSchema);


module.exports = {
    User: User
}