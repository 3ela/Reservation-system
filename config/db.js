const MongoClient = require("mongodb").MongoClient;
const logger = require('./winston');
const { currentDate } = require('../scripts/helpers');
const Mongoose = require('mongoose');

const { HotelModel, RoomModel } = require('../models/hotel_room_models');

let dbConnection = null;
// connection Object
let DBObj = {
  init: () => {
    return new Promise((resolve, reject) => {
      if(!process.env.MONGO_SERVER) {
        reject(dbConnection);
        logger.error('Connection env variable doesnt exist')
      }
      MongoClient.connect(process.env.MONGO_SERVER, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }, (err, db) => {
        if(err || !db) {
          dbConnection = false;
          logger.error("DB error"+err)
          reject(dbConnection)
        } else {
          dbConnection = db.db('GDS');
          logger.info("DB connected @ "+ currentDate())
          resolve(dbConnection)
        }
      })
    })
  },
  getDb: (collection) => {
    return new Promise((resolve, reject) => {
      if(dbConnection == null || dbConnection == false) {
        DBObj.init().then(res => {
          collection 
            ? resolve(dbConnection.collection(collection))
            : resolve(dbConnection)
        }).catch(err => { 
          reject(false)
        })
      }else {
        collection 
            ? resolve(dbConnection.collection(collection))
            : resolve(dbConnection)
      }
    })
  },
  getDBMW: (collection) => {
    return (req, res , next) => {
      if(dbConnection == null || dbConnection == false) {
        DBObj.init().then(res => {
          collection 
            ? req.DBconnection = dbConnection.collection(collection)
            : req.DBconnection = dbConnection
          next();
        }).catch(next)
      }else {
        collection 
          ? req.DBconnection = dbConnection.collection(collection)
          : req.DBconnection = dbConnection
        next();
      }
    }
  },
  mongooseInit: () => {
    let db = Mongoose.connection;
    return new Promise ((resolve, reject) => {
      if(db == 1) {
        resolve(true)
      } else {
        Mongoose.connect(process.env.MONGO_SERVER+'/GDS')
          .then(DBRes  => {
            resolve(true)
            db.on("error", () => {
              let E = new Error(`DB Commection error`, {cause: `mongoose couldn't connect`});
              throw E;
            });
          })
      }
    })
  },
  mongooseInitMW: () => {
    return (req, res, next) => {
      DBObj.mongooseInit().then(res => {
        next()
      }).catch(err => next(err));
    }
  },

  getCurrentModel: (itemModel) => {
    switch(itemModel) {
      case 'hotel':
        return HotelModel;
      case 'room':
        return RoomModel;
    };
  },

  checkManyItemsExistance: (itemModel, itemArray) => {
    return new Promise((resolve, reject) => {
      DBObj.mongooseInit.then(DBRes => {

        itemModel.find({ _id: {$in: itemArray}})
          .then(findRes => {
            if(itemArray.length != findRes?.length) {
              reject({
                msg: 'not all items exist',
                itemArray,
                findRes
              })
            }else {
              resolve(true)
            }
          }).catch(findErr => reject(findErr))
      }).catch(DBErr => reject(DBErr))
    })
  },

  checkItemExistance: (itemModel, itemField, selectFields) => {
    // console.log("itemField", itemField)
    // console.log("itemModel", itemModel)
    return new Promise((resolve, reject) => {
      DBObj.mongooseInit().then(DBRes => {
        //* set Item model
        // let currentModel = DBObj.getCurrentModel(itemModel);
        
        //* find Item by any field
        itemModel.findOne(itemField, selectFields ? selectFields : '', (findErr, findRes) => {
          if(findErr) {
            reject(findErr)
          }else {
            resolve(findRes);
          }
          
        })
      }).catch(DBErr => reject(DBErr))
    })
  },
  
  checkRoomExistanceInHotel: (roomFields, conditionFields, selectFields) => {
    return new Promise((resolve, reject) => {
      DBObj.mongooseInit().then(DBRes => {
        //* find Item by Id
        HotelModel.findOne(roomFields, selectFields ? selectFields : '')
        .populate({
          path: 'rooms_ids',
          match: {
            ...conditionFields
          }
        })
        .exec((findErr, findRes) => {
          if(findErr) {
            reject(findErr)
          }else {
            if (findRes.rooms_ids.length != 0) {
              resolve(findRes);
            }else {
              resolve(null)
            }
          }
        })
      }).catch(DBErr => reject(DBErr))
    })
  },
}


module.exports = DBObj;