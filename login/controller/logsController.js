const dateFormat=require('dateformat');
const fs = require('fs'),
    path = require('path');

const now = new Date();

// Basic usage
const timeStamp= dateFormat(now, "mmmm-dS-yyyy");

const  error = fs.createWriteStream(path.join(__dirname + '../../logs/error-'+timeStamp+'.log'), {flags: 'a+', encoding: 'utf-8'});
const  data = fs.createWriteStream(path.join(__dirname + '../../logs/request.log'), {flags: 'a+', encoding: 'utf-8'});
module.exports = {
    error:(err, req, res, next)=>{
        const fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
        const content = req.method +' | ' +err.status +' | '+err.message+' | '+fullUrl+' | '+'\n';
        error.write(content);
        next();
    },
    logError:(err,action)=>{
        const content = err.message+' | '+action+' | '+'\n';
        error.write(content);
    },
    logRequest:(fields)=>{
        fields+='\n';
        data.write(fields);
    }
};