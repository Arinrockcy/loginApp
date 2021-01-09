const express = require('express');
const router = express.Router();
const app = express();
const requestController = require('../controller/request-controller');
router.post('/v1/login', function(req, res, next) {
    requestController.login(req, res, next);
});
router.post('/v1/log', function(req, res, next) {
    requestController.log(req, res, next);
});
router.post('/v1/auth/logout',function(req, res, next) {
    requestController.logout(req, res, next);
});

router.post('/v1/auth/refreshToken',function(req, res, next) {
    requestController.refreshToken(req, res, next);
});
router.put('/v1/auth/users/:id',function(req, res, next) {
    requestController.updateUser(req, res, next);
});

module.exports = router;
