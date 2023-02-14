var mongoose = require('mongoose');
let Schema = mongoose.Schema;
// const { HotelModel, checkRoomInHotel } = require('./hotel_room_models');
// const { TransportationModel, checkForTransportationCapacity } = require('./transportationmodel');
const { checkItemExistance, checkManyItemsExistance } = require('../config/db');
const { isDatePassed } = require('../scripts/helpers');
const PlacesModel = require('./places_model');
const { RoomModel, HotelModel, checkManyRoomsInHotel } = require('./hotel_room_models');
const { 
  TransportationModel, 
  checkTransportsAvailablility,
  checkTransportHasSeatsOpen
} = require('./transportation_route_models');
const { differenceBetweenTwoArrays, formateDate } = require('../scripts/helpers');

const schema = new Schema({
  time: {
    start_date: {
      type: Date,
      required: true
    },
    end_date: {
      type: Date,
      required: true
    },
  },
  reservation_capacity: {
    type: Number,
  },
  status: {
    type: Boolean,
    default: true,
  },

  //* forign keys
  destination_id: {
    type: Schema.Types.ObjectId,
    ref: 'Place',
    required: true
  },
  reservations_ids: [{
    type: Schema.Types.ObjectId,
    ref: 'Reservation'
  }],
  hotels_ids: [{
    id: {
      type: Schema.Types.ObjectId,
      ref: 'Hotel'
    },
    rooms_ids: [{
      type: Schema.Types.ObjectId,
      ref: 'Room'
    }]
  }],
  transportations_ids: [{
    type: Schema.Types.ObjectId,
    ref: 'Transportation'
  }],

 },
{ 
  timestamps: {
    createdAt: 'created_at', 
    updatedAt: 'updated_at'
  }
});

//* creating a trip 
//* 1. there must be a destination
//* 2. if there is a hotel and no rooms then all rooms 
//*   else  send a specific array of rooms to use for booking
//* 3. transports must be available

//! while updating remove some room ids
//! while updating remove some hotel ids
//? solved by overwriting the hotel_ids object and removing the difference

//todo aggregator for capacity by transports
//todo aggregator for capacity by rooms

schema.pre(['save', 'findOneAndUpdate'], async function(next) {
  var payload = this;
  var findRes;
  if(payload._update && payload._update.id) {
    payload = payload._update
    findRes = await this.model.findOne(this.getQuery());
  }
  
  payload.time.start_date = formateDate(payload.time?.start_date, `DD-MM-YYYY hh:mm a`, "YYYY-MM-DD HH:mm:ss");
  payload.time.end_date = formateDate(payload.time?.end_date, `DD-MM-YYYY hh:mm a`, "YYYY-MM-DD HH:mm:ss");

  //* check for destination change
  if(payload.destination_id) {
    await checkItemExistance(PlacesModel, { _id: payload.destination_id})
    .then(checkRes => {
      if(checkRes == null) {
        next({
          msg: ` Destination doesnt exist `,
          destination_id: payload.destination_id
        })
      }
    })
  }
  //* check hotels data exist 
  if(payload.hotels_ids && payload.hotels_ids.length > 0) {
    //* check if rooms ids sent then add those 
    payload.hotels_ids.forEach(hotel => {
      if(hotel.rooms_ids && hotel.rooms_ids.length > 0) {
        //*  add specific ids
        //?   check if the rooms are on the trips module 
        //?   check if the rooms on that specific hotel
        //?   check if the rooms has no trip id
        checkManyRoomsInHotel(
          hotel.id, 
          hotel.rooms_ids, 
          {trip_id: { $exists: false }, reserve_module: 'trips'}
        )
        .then(checkRes => {
          console.log("specific rooms .pre => checkRes", checkRes)
        }).catch(checkErr => next(checkErr))
      } else {
        //! if no ids sent then add ALL 
        checkManyRoomsInHotel(hotel.id, {trip_id: { $exists: false }, reserve_module: 'trips'})
          .then(checkRes => {
            console.log("all rooms .pre => checkRes", checkRes)
          }).catch(checkErr => next(checkErr))
      }
    })
  }
  if(payload.transportations_ids && payload.transportations_ids.length > 0) {
    await checkTransportsAvailablility(payload.transportations_ids)
      .then(checkRes => {
        console.log("schema.pre transports available => checkRes", checkRes)
      }).catch(checkErr => next(checkErr))
  }

  //* pre update changes
  if(payload.id) {
    if(payload.transportations_ids) {
      //* check for difference in old transports and new transports
      let transportsDifference = differenceBetweenTwoArrays(findRes?.transportations_ids, payload.transportations_ids);
      if(transportsDifference.length > 0) {
        //* if difference exists remove trip_id 
        await TransportationModel.updateMany(
          { _id: transportsDifference },
          { $unset: 'trip_id'},
          { returnDocument: 'after' }
          ).then(updateRes => {
            console.log("schema.post removed trip ides transportation =>", updateRes)
          }).catch(updateErr => next(updateErr))
        }
    }
      
      if(payload.hotels_ids) {
        //* check for difference in rooms    
        payload.hotels_ids.forEach(hotel => {
          let hotelIndexInSavedData = findRes.findIndex(el => el.id == hotel.id);
          if(hotelIndexInSavedData != -1 && hotel.rooms_ids && hotel.rooms_ids.length != 0) {
            let roomsDifference = differenceBetweenTwoArrays(findRes.hotels_ids[hotelIndexInSavedData].rooms_ids, hotel.rooms_ids);
            //* if difference exists remove trip_id 
            RoomModel.updateMany(
              { _id: roomsDifference },
              { $unset: 'trip_id'},
              { returnDocument: 'after' }
            ).then(updateRes => {
              console.log("schema.post removed trip ids from rooms =>", updateRes)
            }).catch(updateErr => next(updateErr))
          }
        })
      }
  }
  next();
})

//* Post Save/update *//

schema.post(['save', 'findOneAndUpdate'], async function(doc, next) {
  const payload = doc;
  // console.log("schema.post => payload", payload)
  
  //* add trip id to added transports if exist
  if(payload.transportations_ids && payload.transportations_ids.length > 0) {
    await TransportationModel.updateMany(
      { _id: { $in: payload.transportations_ids }}, 
      { trip_id: payload.id }, 
      {returnDocument: 'after'})
      .then(updateRes => {
        console.log("added trip ids to transports post save => updateRes", updateRes)
      }).catch(updateErr => next(updateErr))
  }
  //* add trip id to added rooms if exist
  if(payload.hotels_ids && payload.hotels_ids.length > 0) {
    await payload.hotels_ids.forEach(hotel => {
      RoomModel.updateMany(
        { _id: { $in: hotel.rooms_ids} }, 
        { trip_id: payload.id }, 
        {returnDocument: 'after'})
        .then(updateRes => {
          console.log("added trip ids to rooms post save => updateRes", updateRes)
        }).catch(updateErr => next(updateErr))
      })
    }
    next()
  })

//* ----- *//
//* check for trip existance and limit
function checkTripExistAndLimit(trip_id, transports_ids, hotels_ids, number_of_guests) {
  return new Promise((resolve, reject) => {
  
    //* check for the trip ID
    tripModel.findById(trip_id)
      .then(findRes => {
        if(findRes != null) {
          //* counters
          let isSeatEqualGuest = 0;
          let isRoomsEqualGuest = 0;

          transports_ids.forEach(transport => {
            let isTransportOnTrip = findRes.transportations_ids.findIndex(el => el == transport); 
            if(isTransportOnTrip != -1) {
              checkTransportHasSeatsOpen(transport.id, transport.seat_numbers)
                .then(checkRes => { 
                  isSeatEqualGuest = isSeatEqualGuest + transport.seat_numbers;
                }).catch(checkErr => reject(checkErr))
            }
          })
          //* check if number of seats eq guests
          if(isSeatEqualGuest < number_of_guests) {
            reject({
              msg: ' Seats are not enough for the guests ',
              number_of_seats: isSeatEqualGuest,
              number_of_guests
            })
          }  

          hotels_ids.forEach(hotel => {
            let isHotelOnTrip = findRes.hotels_ids.findIndex(el => el.id == hotel.id); 
            let diffInRooms = differenceBetweenTwoArrays(hotel.rooms_ids, findRes.hotels_ids.rooms_ids) 
            if(isHotelOnTrip =! -1 && hotel.rooms_ids.length == diffInRooms.length) {
              //* aggregate teh rooms number
              
            }
          })
        } else {
          reject({
            msg: `This Trip doesnt exist`,
            trip_id
          })
        }   
      }).catch(findErr => reject(findErr)) 
  })
}
  


const tripModel =  mongoose.model('Trip', schema);

module.exports = tripModel;