const Request_Controller = function () {
    const DB = require('./db-controller');
    const jwt = require('jsonwebtoken');
    const bcrypt = require('bcrypt');
    const logger = require('./logsController');
    const mockDB = require('../data.mock');
    const config_param = require('config');
    const _this = this;
    this.checkSession = (req, res, next) => {
        const cookie = req.headers.cookie;

        if (!this.isLoginPage(req.originalUrl)) {
            if (!this.isCookieSet(cookie, 'userSession') || this.getCookieValue(cookie, 'userSession') == '') {
                res.redirect('/login');
            }

        } else if (this.isCookieSet(cookie, 'userSession') && this.getCookieValue(cookie, 'userSession') != '' && this.isLoginPage(req.originalUrl)) {
            res.redirect('/');
        }
        next();

    };
    this.checkRequest = (req, res, next) => {
        const token = req.get('Authorization');
        if (typeof token == 'undefined' || !token) {
            res.status(403);
            res.json({status: false, message: "Permission denied"});
            return false;
        }
        if (!token.startsWith('Bearer')) {
            // Reject if there is no Bearer in the token
            res.status(403);
            res.json({status: false, message: "Token Invalid"});
            return false;
        }
        try {
            const privateKey = config_param.JWT.key;
            const cookie = req.headers.cookie;
            jwt.verify(token, privateKey, (err, decodedToken) => {
                if (err) {
                    res.status(403);
                    res.json({status: false, message: err.message});
                }   // Check the decoded user
                const email = this.isCookieSet(cookie, 'userSession') ? this.base64Decode(this.getCookieValue(cookie, 'userSession')) : '';
                if (!decodedToken || !decodedToken.user || decodedToken.user != email) {
                    res.status(403);
                    res.json({status: false, message: "Token Invalid"});
                    return false;
                }
                next()
            })
        } catch (e) {
            res.status(403);
            res.json({status: false, message: "Permission denied"});
            return false;
        }


    };
    this.login = (req, res, next) => {
        const email = req.body.email;
        DB.findOne(email).then((data) => {
            if (!this.empty(data)) {
                const password = req.body.password;
                bcrypt.compare(password, data.password, function (err, result) {
                    if (err) {
                        res.json({status: false, message: "password matched failed"})
                    }
                    if (result) {
                        const privateKey = config_param.JWT.key;
                        const token = jwt.sign({userName: email}, privateKey, {algorithm: 'HS256'}, {expiresIn: '30d'});
                        res.cookie('userSession', _this.base64Encode(email), {maxAge: 900000000, httpOnly: true});
                        res.cookie('userFingerPrint', _this.base64Encode(JSON.stringify({type: data.type})), {
                            maxAge: 900000000,
                            httpOnly: true
                        });
                        const tockens= getNewToken(token, res)
                        res.json({status: true, message: "welcome", token: tockens, type: data.type, id: data._id});
                    } else {
                        res.json({status: false, message: "password not  matched failed"})
                    }

                });
            } else {
                res.json({status: false, message: "user not found"})
            }

        });
    };
    this.logout = (req, res, next) => {

        res.cookie('userSession', '', {maxAge: Date.now(), httpOnly: true});
        res.cookie('userFingerPrint', '', {maxAge: Date.now(), httpOnly: true});
        res.json({status: true, message: "logout"});


    };
    this.register = (field) => {
        return new Promise((resolve, reject) => {
            bcrypt.hash(field.password, 10, (err, hash) => {
                if (err) {
                    reject(err);
                }
                field.password = hash;
                DB.insertOne(field).then(data => {
                    console.log(data);
                    resolve(data);
                }).catch(errmsg => {
                    reject(errmsg);
                });
            });
        });
    };
    this.addUser = (field) => {
        bcrypt.hash(field.password, 10, (err, hash) => {
            if (err) {
                console.log(err);
            }
            field.password = hash;
            DB.insertOne(field).then((data) => {
            }).catch((errmsg) => {
            });
        });
    };
    this.registerUser = (req, res, next) => {
        const data = req.body;
        const userName = _this.getUserName(data.email);
        const field = {
            email: data.email,
            userName: userName,
            password: data.password,
            fullName: data.fullName,
            type: data.type
        };
        this.register(field).then(data => {
            res.json({status: true, message: JSON.stringify(data)});
        }).catch(errmsg => {
            res.json({status: false, message: JSON.stringify(errmsg)});
        });
    };

    this.updateUser = (req, res, next) => {
        const id = req.params.id;
        const data = req.body;
        const field = {};
        Object.keys(data).forEach(function (key) {
            field[key] = data[key];
        });
        if (typeof field.password != 'undefined' && field.password != '') {
            bcrypt.hash(field.password, 10, (err, hash) => {
                if (err) {
                    res.json({status: false, data: JSON.stringify(err)});
                    return false;
                }
                field.password = hash;
                DB.updateOneById(id, field).then(data => {
                    res.json({status: true, data: data});
                    return false;
                }).catch(errmsg => {
                    res.json({status: false, data: JSON.stringify(errmsg)});
                    return false;
                });
            });
        } else {
            DB.updateOneById(id, field).then(data => {
                res.json({status: true, data: data});
                return false;
            }).catch(errmsg => {
                res.json({status: false, data: JSON.stringify(errmsg)});
                return false;
            });
        }

    };

    this.log = (req, res, next) => {
        res.json({status: true});
    };

    this.logRequest = (req, res, next) => {
        const data = {};
        data.email = this.base64Decode(req.cookies['userSession']);
        data.method = req.method;
        data.url = req.protocol + '://' + req.get('host') + req.originalUrl;
        data.params = req.params;
        data.payload = req.body;
        data.time = new Date();
        logger.logRequest(JSON.stringify(data));
        next();
    };

    const getUpdatedRefreshToken = (oldRefreshToken, payload) =>{
        // create new refresh token
        const newRefreshToken = jwt.sign({user: payload}, jwtSecretString, { expiresIn: '30d' });
        // replace current refresh token with new one
        mockDB.tokens = mockDB.tokens.map(token => {
            if (token.refreshToken === oldRefreshToken) {
                return {
                    ...token,
                    refreshToken: newRefreshToken
                };
            }  return token;
        }); return newRefreshToken;
    }
    const getAccessToken = (payload) => {
        return jwt.sign({user: payload}, jwtSecretString, { expiresIn: '15min' });
    }
    const getNewToken = (token, res) => {
        const decodedToken = jwt.verify(token, jwtSecretString);
        // find the user in the user table
        const user = mockDB.users.find(user => user.email = decodedToken.user.email); if (!user) {
            throw new Error(`Access is forbidden`);
        } // get all user's refresh tokens from DB
        const allRefreshTokens = mockDB.tokens.filter(refreshToken => refreshToken.email === user.email); if (!allRefreshTokens || !allRefreshTokens.length) {
            throw new Error(`There is no refresh token for the user with`);
        } const currentRefreshToken = allRefreshTokens.find(refreshToken => refreshToken.refreshToken === token); if (!currentRefreshToken) {
            throw new Error(`Refresh token is wrong`);
        }
        // user's data for new tokens
        const payload = {
            email: user.email,
            username: user.email
        };
        // get new refresh and access token
        const newRefreshToken = getUpdatedRefreshToken(token, payload);
        const newAccessToken = getAccessToken(payload); return {
            accessToken: newAccessToken,
            refreshToken: newRefreshToken
        };
    }

    this.refreshToken = (req, res, next) => {
        const refreshToken = req.body.refreshToken;
        if (!refreshToken) {
            return res.status(403).send('Access is forbidden');
        }
        try {
            const newTokens = getNewToken(refreshToken, res);
            res.send(newTokens);
        } catch (err) {
            const message = (err && err.message) || err;
            res.status(403).send(message);
        }
    }
};

Request_Controller.prototype = {
    isCookieSet: (cookie, a) => {
        return typeof cookie != 'undefined' && cookie != '' && (cookie.indexOf(a) >= 0);
    },
    getCookieValue: (cookie, a) => {
        let cookieData = false;
        let b = cookie.match('(^|;)\\s*' + a + '\\s*=\\s*([^;]+)');
        cookieData = b ? b.pop() : false;
        return cookieData;
    },
    isLoginPage: (url) => {
        return (url.indexOf('/login') >= 0);
    },
    empty: (mixedVar) => {

        let undef, key, i, len, emptyValues = [ undef, null, false, 0, '', '0' ];

        for (i = 0, len = emptyValues.length; i < len; i++) {
            if (mixedVar === emptyValues[i]) {
                return true
            }
        }

        if (typeof mixedVar === 'object') {
            for (key in mixedVar) {
                if (mixedVar.hasOwnProperty(key)) {
                    return false
                }
            }
            return true
        }

        return false
    },
    base64Decode: (data) => {
        if (typeof data == 'undefined' || data == '')
            return '';
        let buff = Buffer.from(data, 'base64');
        return buff.toString('ascii');
    },
    base64Encode: (data) => {
        let buff = Buffer.from(data);
        return buff.toString('base64');

    },
    getUserName: (email) => {
        let userName = email.split("@")[0];
        userName += parseInt(Math.random() * (20 - 1) + 1);
        return userName
    }
};
module.exports = new Request_Controller();