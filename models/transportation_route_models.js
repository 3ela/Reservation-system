var mongoose = require('mongoose');
const TransportSchema = require('./schema/transportaition_schema');
const RouteSchema  = require('./schema/route_schema');
const UserModel = require('./user_model');
const { checkItemExistance, checkManyItemsExistance } = require('../config/db');

//* ------
//* Transportation schema middlewares
//* ------
TransportSchema.pre(['save', 'findOneAndUpdate'], function(next) {
  let payload = this;

  if(payload.route_id && payload.vehicle_status == 'available') {
    checkItemExistance(RouteModel, { _id: payload.id })
      .then(checkRes => {
        if(checkRes == null) {
          next({
            msg: "Transport doesnt exist",
            route_id: payload.id 
          })
        }
      }).catch(checkErr => next(checkErr))
  }
  checkItemExistance(UserModel, { _id: payload.driver.user_id })
    .then(checkRes => {
      if(checkRes == null) {
        next({
          msg: "User doesnt exist",
          driver: {
            user_id:payload.driver.user_id
          }
        })
      }else {
        next();
      }
    }).catch(checkErr => next(checkErr))
})

//* ------
//* Route schema middlewares
//* ------
RouteSchema.pre(['save', 'findOneAndUpdate'], function(next) {
  let payload = this;

  payload.time.take_off_time = formateDate(payload.time?.take_off_time, `DD-MM-YYYY HH:MM AA`, "DD-MM-YYYY HH:MM");
  payload.time.arrival_time = formateDate(payload.time?.arrival_time, `DD-MM-YYYY HH:MM AA`, "DD-MM-YYYY HH:MM");

  if(payload.transportations_ids) {
    checkManyItemsExistance(TransportationModel, payload.transportations_ids)
      .then(checkRes => {
        checkRes.forEach(transport => {
          if(transport.vehicle_status != 'available') {
            next({
              msg: `Not all trasnportations are available`,
              data: checkRes
            })
          }
        })
      }).catch(checkErr => next(checkErr))
  }
  if(payload.departure_place_id != payload.destination_place_id) {
    next();
  } else {
    next({
      msg: "Departure and destination cant be the same",
      data: {
        departure_place_id: payload.departure_place_id,
        destination_place_id: payload.destination_place_id
      }
    });
  }
})

//todo automatically list the future routes only

//todo Add a function that knows what chair is reserved
//todo Add a function that attach a chair to a reserve
//todo per vehicle model seat validation

//? on the assign functions :- 
//todo check for the availability of a transport before assigning to a route
//todo check for route date (cant be before today) before assigning to a route

function checkForTransportationCapacity(transId) {
  return new Promise((resolve, reject) => {
    TransportationModel.findById(transId)
    .then(findRes => {
      if(findRes == null) {
        reject({
          msg: `Trans was not found `,
          transportation_id: transId
        })
      }else {
        if(findRes.reservations_ids.length < findRes.vehicle.capacity) {
          resolve(findRes)
        }else {
          reject({
            msg: `Trans Has no space`,
            data: findRes
          })
        }
      }
    }).catch(findErr => {
      reject(findErr)
    })
  })
}

function checkTransportsAvailablility(transports_ids) {
  return new Promise((resolve, reject) => {
    TransportationModel.find(
      { 
        _id: { $in: transports_ids },
        vehicle_status: 'available'
      })
      .then(findRes => {
        if(findRes.length != transports_ids.length || findRes == null) {
          reject({
            msg: ` Not all transports are available `,
            data: findRes
          })
        } else {
          resolve(findRes)
        }
      })
  })
}


//* models for this file
let RouteModel = mongoose.model('Route', RouteSchema);
let TransportationModel = mongoose.model('Transportation', TransportSchema);


module.exports = {
  TransportationModel,
  RouteModel,
  checkForTransportationCapacity,
  checkTransportsAvailablility
}