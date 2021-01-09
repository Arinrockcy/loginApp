var mongo = require('mongodb');
var MongoClient = mongo.MongoClient;
let dbConfig = require('config');
dbConfig = dbConfig.db;
const logController = require('./logsController');
var ObjectId = require('mongodb').ObjectID;
const Db_Utils = function(){
    const connection= ()=>{
        return new Promise((resolve,reject)=> {
            const uri = dbConfig.host + '/' + dbConfig.dataBase + "?authSource='+dbConfig.dataBas+'&ssl=true";
            MongoClient.connect(uri, {useNewUrlParser: true}, (err, db) => {
                if (err) {
                    logController.logError(err, 'Mongo Connection');
                    reject(err) ;
                }
                else {
                    resolve (db.db(dbConfig.dataBase));
                }
            });
        });
    };
    this.findOne = (email)=>{
        return new Promise((resolve,reject)=>{
            const DB = connection();
            DB.then((db)=>{
                db.collection(dbConfig.loginCollection).findOne(this.orQuery(email), (err, result)=> {
                    if(err){
                        logController.logError(err,'Mongo find One');
                        reject(err);
                    }
                    else
                    {
                        resolve (result);
                    }
                })
            });
        });
    };
    this.findOneById = (id)=>{
        return new Promise((resolve,reject)=>{
            const DB = connection();
            DB.then((db)=>{
                db.collection(dbConfig.loginCollection).findOne({"_id":new ObjectId(id)}, (err, result)=> {
                    if(err){
                        logController.logError(err,'Mongo find One');
                        reject(err);
                    }
                    else
                    {
                        resolve (result);
                    }
                })
            });
        });
    };
    this.insertOne= (data)=>{
        return new Promise((resolve,reject)=>{
            const DB = connection();
            DB.then((db)=>{
                db.collection(dbConfig.loginCollection).insertOne(data, (err, result)=> {
                    if(err){
                        logController.logError(err,'Mongo insert One');
                        reject(err);
                    }
                    else
                    {
                        resolve (result);
                    }
                })
            }).catch((err)=>{
            });
        });
    };

    this.updateOne=(email,field)=>{
        return new Promise((resolve,reject)=>{
            const DB = connection();
            DB.then(db=>{
                const query = this.orQuery(email);
                const values = { $set: field };
                db.collection(dbConfig.loginCollection).updateOne(query, values, (err, res)=> {
                    if(err){
                        logController.logError(err,'Mongo updateOne');
                        reject(err);
                    }
                    else
                    {
                        resolve (res);
                    }
                })
            });
        })
    };
    this.updateOneById=(id,field)=>{
        return new Promise((resolve,reject)=>{
            const DB = connection();
            DB.then(db=>{
                const query = {"_id":ObjectId(id)};
                const values = { $set: field };
                db.collection(dbConfig.loginCollection).updateOne({"_id":ObjectId(id)}, values,{ upsert: true }, (err, res)=> {
                    if(err){
                        logController.logError(err,'Mongo updateOne');
                        reject(err);
                    }
                    else
                    {
                        resolve (res);
                    }
                })
            });
        })
    };
    this.deleteOneById=(id)=>{
        return new Promise((resolve,reject)=>{
            const DB = connection();
            DB.then(db=>{
                const query = {"_id":ObjectId(id)};
                db.collection(dbConfig.loginCollection).deleteOne({"_id":ObjectId(id)},(err, res)=> {
                    if(err){
                        logController.logError(err,'Mongo delete one by id');
                        reject(err);
                    }
                    else
                    {
                        resolve (res);
                    }
                })
            });
        })
    };
    this.findAll = ()=>{
        return new Promise((resolve,reject)=>{
            const DB = connection();
            DB.then((db)=>{
                db.collection(dbConfig.loginCollection).find().toArray(function(e, d) {
                    if(e)
                    {
                        reject(e);
                    }
                    resolve(d);
                });

            });
        });
    }
};
Db_Utils.prototype = {

    caseInsensitiveQuery:(email)=>{
        return { $regex : new RegExp(email, "i") };
    },
    orQuery:(email)=>{
        email = Db_Utils.prototype.caseInsensitiveQuery(email);
        return {$or:[{"email":email},{"userName":email}]};
    }
};
module.exports = new Db_Utils();