const routers = require('./routes/index');
const requestController = require('./controller/request-controller');
const Login_Controller = function (app) {
    app.use('/v1/*', requestController.logRequest);
    app.use('/v1/auth/*', requestController.checkRequest);
    app.use('/', routers);
    return function (req, res, next) {
        next();
    }
};

module.exports = Login_Controller;