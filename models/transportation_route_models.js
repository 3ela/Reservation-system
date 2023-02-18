var mongoose = require('mongoose');
const TransportSchema = require('./schema/transportaition_schema');
const RouteSchema  = require('./schema/route_schema');
const UserModel = require('./user_model');
const PlaceModel = require('./places_model');
const { checkItemExistance, checkManyItemsExistance } = require('../config/db');
const { formateDate, differenceBetweenTwoArrays } = require('../scripts/helpers');

//* ------
//* Transportation schema middlewares
//* ------
TransportSchema.pre(['save', 'findOneAndUpdate'], async function(next) {
  let payload = this;

  //* if paylaod route_id change => cahnge vehicel status to assigned
  //* if paylaod vehicle status change to available => remove route_id
  
  if(payload._update && payload._update.id) {
    payload = payload._update;
    var findRes = await this.model.findOne(this.getQuery());
  }

  if(payload.route_id) {
    //* route to be changed
    await checkItemExistance(RouteModel, { _id: payload.route_id })
      .then(checkRes => {
        if(checkRes == null) {
          next({
            msg: "Route doesnt exist",
            route_id: payload.route_id 
          })
        }else if(findRes && (findRes.vehicle_status != 'available' && payload.vehicle_status != 'assigned')){
          //* works on update only
          next({
            msg: "Transport is not available",
            transportation: findRes 
          })
        }else {
          //* change status 
          //* add transport id to route in .POST update and save
          payload.vehicle_status = 'assigned';
        }
      }).catch(checkErr => next(checkErr))
  }
  if(payload.driver) {
    await checkItemExistance(UserModel, { _id: payload.driver?.user_id })
      .then(checkRes => {
        if(checkRes == null) {
          next({
            msg: "User doesnt exist",
            driver: {
              user_id:payload.driver?.user_id
            }
          })
        }else {
          next();
        }
      }).catch(checkErr => next(checkErr))
  }
})

TransportSchema.pre('updateOne', async function(next) {
  let payload = this._update;
  let findRes = await this.model.findOne(this.getQuery());

  if(!payload.route_id) {
    //* deassign route
    
    await RouteModel.findByIdAndUpdate(
      findRes.route_id,
      { $pull: { transportations_ids: findRes.id }},
      { returnDocument: 'after'}
    ).then(updateRes  => {
      next();
    }).catch(updateErr => next(updateErr))
  } else {
    //* assign route
    await checkItemExistance(RouteModel, { _id: payload.route_id })
      .then(checkRes => {
        if(checkRes == null) {
          next({
            msg: "Route doesnt exist",
            route_id: payload.route_id 
          })
        }else if(findRes && findRes.vehicle_status != 'available'){
          next({
            msg: "Transport is not available",
            transportation: findRes 
          })
        }else {
          //* change status 
          //* add transport id to route in .POST update and save
          payload.vehicle_status = 'assigned';
        }
      }).catch(checkErr => next(checkErr))
  }
})

TransportSchema.post(['save', 'findOneAndUpdate', 'updateOne'], async function(doc, next) {
  let payload = doc;
  if(payload.acknowledged) {
    payload = await this.model.findOne(this.getQuery());
  }

  if(payload.route_id) {
    await RouteModel.updateMany(
      { _id: payload.route_id },
      { $push: { transportations_ids: payload.id }},
      { returnDocument: 'after'}
    ).then(updateRes => {
      next();
    })
    .catch(updateErr => next(updateErr))
  } else {
    next();
  }

})


//* ------
//* Route schema middlewares
//* ------
RouteSchema.pre(['save', 'findOneAndUpdate'], async function(next) {
  let payload = this;

  if(payload._update && payload._update.id) {
    payload = payload._update;
    var findRes = await this.model.findOne(this.getQuery());
  }
  
  payload.time.take_off_time = formateDate(payload.time?.take_off_time, `DD-MM-YYYY hh:mm a`, "YYYY-MM-DD HH:mm:ss");
  payload.time.arrival_time = formateDate(payload.time?.arrival_time, `DD-MM-YYYY hh:mm a`, "YYYY-MM-DD HH:mm:ss");
  
  //* check if the transports exist
  if(payload.transportations_ids) {
    await checkTransportsAvailablility(payload.transportations_ids)
    .then(transportsRes => {
      //* check if some transports deleted
      let tranpsortDifference = differenceBetweenTwoArrays(findRes?.transportations_ids, payload.transportations_ids);
      if(tranpsortDifference && tranpsortDifference.length > 0) {
        //* remove route id and change back the availablilty
        TransportationModel.updateMany(
          { _id: { $in: tranpsortDifference}},
          {
            vehicle_status: 'available',
            $unset: {route_id: ''}
          },
          { returnDocument: 'after'}
        ).then(updateRes => {
          next();
        }).catch(updateErr => next(updateErr));
      }else {
        next();
      }
    }).catch(transportsErr => next(transportsErr));
  }
  if(payload.departure_place_id != payload.destination_place_id) {
    await checkManyItemsExistance(PlaceModel, [payload.departure_place_id, payload.destination_place_id])
    .then(checkRes => {
        next()
      }).catch(checkErr => next(checkErr))
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

RouteSchema.pre('updateOne', async function(next) {
  let payload = this._update;
  let findRes = await this.model.findOne(this.getQuery());
  //? on the assign functions :- 
  //* check route existance 

  //* check for the availability of a transport before assigning to a route
  //* check for route date (cant be before today) before assigning to a route
  await checkItemExistance(RouteModel, { _id: payload.id })
    .then(checkRes => {
      if(checkRes == null) {
        next({
            msg: `Route doesnt exist`,
            id: payload.id
        })
      }
    }).catch(checkErr => next(checkErr));
  await checkTransportsAvailablility(payload.transportations_ids)
    .then(transportsRes => {
      //* check if some transports deleted
      let tranpsortDifference = differenceBetweenTwoArrays(findRes.transportations_ids, payload.transportations_ids);
      if(tranpsortDifference && tranpsortDifference.length > 0) {
        //* remove route id and change back the availablilty
        TransportationModel.updateMany(
          { _id: { $in: tranpsortDifference}},
          {
            vehicle_status: 'available',
            $unset: {route_id: ''}
          },
          { returnDocument: 'after'}
        ).then(updateRes => {
          next();
        }).catch(updateErr => next(updateErr));
      }else {
        next();
      }
    }).catch(transportsErr => next(transportsErr));
});

RouteSchema.post(['updateOne', 'findOneAndUpdate', 'save'], async function(doc, next) {
  let payload = doc;
  if(payload.acknowledged) {
    payload = await this.model.findOne(this.getQuery());
  }
  
  //* assign route and change transport status
  if (payload.transportations_ids && payload.transportations_ids?.length > 0) {
    await TransportationModel.updateMany(
      {_id: { $in: payload.transportations_ids}},
      {
        vehicle_status: 'assigned',
        route_id: payload.id
      })
      .then(updateRes => {
        next()
      }).catch(updateErr => next(updateErr));
  }else {
    next();
  }
})

//todo automatically list the future routes only

//todo Add a function that knows what chair is reserved
//todo Add a function that attach a chair to a reserve
//todo per vehicle model seat validation


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
        vehicle_status: 'available',
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
      }).catch(findErr => reject(findErr))
  })
}

function checkTransportHasSeatsOpen(transport_id, seat_numbers) {
  return new Promise((resolve, reject) => {
    TransportationModel.findById(transport_id)
    .then(findRes => {  
      if(findRes != null) {
        try {
            console.log('transportation', seat_numbers, findRes.reserved_seats)
            let seatsInReservationOfTransport = differenceBetweenTwoArrays(seat_numbers, findRes.reserved_seats);
            if(seatsInReservationOfTransport.length == seat_numbers.length) {
              resolve(findRes);
            } else {
              reject({
                msg: ` Not all seats are open `,
                seat_numbers,
                seatsInReservationOfTransport
              })
            }
          } catch (error) {
            reject({
              msg: ` Not all seats are open `,
              seat_numbers,
              error
            })
          }
        } else {
          reject({
            msg: `This Transportation doesnt exist`,
            transport_id
          })
        }
      }).catch(findErr => reject(findErr))
  })
}

function checkAllTransportsHasSeatsOpen(transports_ids) {
  return new Promise((resolve, reject) => {
    //* loop for all transports to check if all seats are empty
    let transportsPromises = transports_ids.map(transport => checkTransportHasSeatsOpen(transport.id, transport.seats_numbers));

    Promise.all(transportsPromises)
      .then(transportsRes => {
        resolve(transportsRes)
      }).catch(transportErr => reject(transportErr))
  })
}

//* models for this file
let RouteModel = mongoose.model('Route', RouteSchema);
let TransportationModel = mongoose.model('Transportation', TransportSchema);


module.exports = {
  TransportationModel,
  RouteModel,
  checkForTransportationCapacity,
  checkTransportsAvailablility,
  checkTransportHasSeatsOpen,
  checkAllTransportsHasSeatsOpen
}

