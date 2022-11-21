var mongoose = require('mongoose');
let Schema = mongoose.Schema;
// const { HotelModel, checkRoomInHotel } = require('./hotel_room_models');
// const { TransportationModel, checkForTransportationCapacity } = require('./transportationmodel');
const { checkItemExistance, checkManyItemsExistance } = require('../config/db');
const { isDatePassed } = require('../scripts/helpers');
const PlacesModel = require('./places_model');
const { RoomModel, HotelModel, checkManyRoomsInHotel } = require('./hotel_room_models');
const { TransportationModel, checkTransportsAvailablility } = require('./transportation_route_models');
const { differenceBetweenTwoArrays } = require('../scripts/helpers');

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
//? solved by overwriting the hotel_ids object

//todo aggregator for capacity by transports
//todo aggregator for capacity by rooms

schema.pre(['save', 'findOneAndUpdate'], function(next) {
  let payload = this;
  
  //* check for destination change
  if(payload.destination_id) {
    checkItemExistance(PlacesModel, { _id: payload.destination_id})
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
        checkManyRoomsInHotel(hotel.id, hotel.rooms_ids)
        .then(checkRes => {
          console.log("specific rooms .pre => checkRes", checkRes)
        }).catch(checkErr => next(checkErr))
      } else {
        //* if no ids sent then add ALL 
        checkManyRoomsInHotel(hotel.id)
        .then(checkRes => {
          console.log("all rooms .pre => checkRes", checkRes)
        }).catch(checkErr => next(checkErr))
      }
    })
  }
  if(payload.transportations_ids && payload.transportations_ids.length > 0) {
    checkTransportsAvailablility(payload.transportations_ids)
      .then(checkRes => {
        console.log("schema.pre transports available => checkRes", checkRes)
      }).catch(checkErr => next(checkErr))
  }
  next()
})

schema.post(['save', 'findOneAndUpdate'], async function(doc, next) {
  const findRes = await this.model.findOne(this.getQuery());
  const payload = this._update;
  
  //* post update changes
  if(payload.id) {
    //* check for difference in old transports and new transports
    let transportsDifference = differenceBetweenTwoArrays(findRes.transportations_ids, payload.transportations_ids);
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
      
      //* check for difference in rooms    
      await payload.hotels_ids.forEach(hotel => {
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
  
  //* add trip id to added tramsports if exist
  if(findRes.transportations_ids && findRes.transportations_ids.length > 0) {
    await TransportationModel.updateMany(
      { _id: { $in: findRes.transportations_ids }}, 
      { trip_id: findRes.id }, 
      {returnDocument: 'after'})
      .then(updateRes => {
        console.log("added trip ids to transports post save => updateRes", updateRes)
      }).catch(updateErr => next(updateErr))
  }
  //* add trip id to added rooms if exist
  if(findRes.hotels_ids && findRes.hotels_ids.length > 0) {
    await findRes.hotel_ids.forEach(hotel => {
      RoomModel.updateMany(
        { _id: { $in: hotel.rooms_ids} }, 
        { trip_id: findRes.id }, 
        {returnDocument: 'after'})
        .then(updateRes => {
          console.log("added trip ids to rooms post save => updateRes", updateRes)
        }).catch(updateErr => next(updateErr))
      })
    }
    next()
  })

module.exports = mongoose.model('Trip', schema)