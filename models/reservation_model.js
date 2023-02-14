var mongoose = require('mongoose');
let Schema = mongoose.Schema;

const { HotelModel, RoomModel, checkRoomInHotel, checkAllHotelsRooms } = require('./hotel_room_models');
const { TransportationModel, checkForTransportationCapacity, checkAllTransportsHasSeatsOpen } = require('./transportation_route_models');

const schema = new Schema({
  period: {
    start_date: {
      type: Date,
    },
    end_date: {
      type: Date,
    },
  },
  number_of_guests: {
    type: Number,
    required: true,
  },
  reserve_status: {
    type: String,
    enum: ['pending', 'confirmed', 'canceled'],
    default: 'pending'
  },
  reserve_module: {
    type: String,
    enum: ['trips', 'rooms', 'transports'],
    required: true,
  },
  
  //* forign keys
  trip_id: {
    type: Schema.Types.ObjectId,
    ref: 'Trip'
  },
  payment_id: {
    type: Schema.Types.ObjectId,
    ref: 'Payment'
  },
  hotels_ids: [{
    id: {
      type: Schema.Types.ObjectId,
      ref: 'Hotel'
    },
    rooms_ids: [{
      type: Schema.Types.ObjectId,
      ref: 'Room'
    }],
  }],
  transportations_ids: [{
    id: {
      type: Schema.Types.ObjectId,
      ref: 'Transportation'
    },
    seats_numbers: [
      {
        type: String
      }
    ]
  }],
  
  
},
{ 
  timestamps: {
    createdAt: 'created_at', 
    updatedAt: 'updated_at'
  }
});

//* check for room && check for availabilit & capacity 
//* check for transportation && check for capacity
//? make sure the rooms and the transports from the same module as the reservation

//? for each reserve there must be at least a transportaion, 
//? room or full trip ID.

schema.pre('save', function(next) {
  let payload = this; 

  //* reserve rooms only
  if(
      payload.reserve_module == 'rooms' && payload.hotels_ids 
      && !payload.trip_id && (payload.transportations_ids?.length == 0 || !payload.transportations_ids)
    ) {
      
      //* check for all hotel and rooms exist on it
      checkAllHotelsRooms(payload.hotels_ids)
      .then(checkRes => {
        if(checkRes == null) {
          next({
            msg: ` Some of the Rooms Ids Are Not found on the Hotel `,
            err: findRes
          })
        } else {
          //* all rooms exist on the hotel
          next();
        }
      }).catch(checkErr => next(checkErr))
      
    }else if(
    //* reserve OneDay trip only
      payload.reserve_module == 'transports' && payload.transportations_ids 
      && !payload.trip_id && (!payload.hotels_ids || payload.hotels_ids?.length == 0)
    ) {
      checkAllTransportsHasSeatsOpen(payload.transportations_ids) 
      .then(checkRes => {
        //* all seats are open
        next();
      }).catch(checkErr => next(checkErr))

    }else if(
    //* reserve a full trip
          
      payload.reserve_module == 'trips' && payload.trip_id
    ) {

    // todo check for capacity on trip
    // todo check for capacity on rooms
    // todo check for capacity on transportations
    // ? trip doenst need a period
    //! use guest number to check space in transport and rooms
    //? if no treansport or rooms then AUTO reserve places for the user

    let roomsPromise = checkAllHotelsRooms(payload.hotels_ids, payload.number_of_guests);
    let transportsPromise = checkAllTransportsHasSeatsOpen(payload.transportations_ids, payload.number_of_guests);
    // let tripPromise = 
    
    Promise.all([roomsPromise, transportsPromise])
      .then(values => {
      }).catch(valErr => next(valErr))
  }else {
    if(payload.reserve_module == 'rooms' && !(payload.hotels_ids)) {
      next({
        msg: `Reservation needs data Hotel/Rooms IDs on Rooms Module`,
        data: payload
      })
    } else if(payload.reserve_module == 'transports' && !payload.transportations_ids ) {
      next({
        msg: `Reservation needs data Transportation ID on Transports Module`,
        data: payload
      })
    }else if(payload.reserve_module == 'trips' && !payload.transportations_ids || !payload.rooms_ids || !payload.hotels_ids) { 
      next({
        msg: `Reservation needs data Hotel/Rooms IDs and Transport ID on Trips Module`,
        data: payload
      })
    } else {
      next({
        msg: `Reservation needs data Hotel/Rooms Or transportation Or Trip ID`,
        data: payload
      })
    }
  }
  
});

//todo   Make the user reserve into multiple hotels / multiple transportaion and it gets filled auto 

schema.post('save', function(doc, next) {
  //* add reserve_id to all object exists on the created shit
  if(doc.reserve_module == 'rooms') {
    //* create two promise loops for each hotel and each room inside each hotel
    let hotelPromise = doc.hotels_ids.map(hotel => hotelSavePromise(hotel, doc))

    Promise.all(hotelPromise).then(hotelPromisesRes => {
      next()
    }).catch(hotelPromisesErr => next(hotelPromisesErr))

  }else if(doc.reserve_module == 'transports') {
    let transportsPromises = doc.transportations_ids.map(transport => {
      return TransportationModel.findOneAndUpdate(
        { _id: transport.id }, 
        { $push: { reservations_ids: { id: doc.id, seats_numbers: transport.seats_numbers}} }
      )
      .then(trasnportRes => {
      }).catch(trasnportErr => next(trasnportErr))
    })

    //* run all promises
    Promise.all(transportsPromises)
      .then(transportsRes => next())
      .catch(transportsErr => next(transportsErr))
  }else if(doc.reserve_module == 'trips') {
    
  }
});


//? hotel Promise for save
function hotelSavePromise(hotel, doc) {
  return new Promise((resolve, reject) => {
    HotelModel.findOneAndUpdate({ _id: hotel.id}, { $push: { reservations_ids: doc.id}})
    .then(hotelRes => {  
      //* create reservation on each room
      let roomsPromises = hotel.rooms_ids.map(room => roomSavePromise(room, doc.id));
      
      Promise.all(roomsPromises).then(roomPromisesRes => {
        resolve(roomPromisesRes);
      }).catch(roomPromisesErr => reject(roomPromisesErr))
    }).catch(hotelErr => reject(hotelErr))
  })
 
}

//? room Promise for save
function roomSavePromise(room, doc_id) {
  return new Promise((resolve, reject) => {
    RoomModel.updateMany(
        { _id: room }, 
        { $push: { reservation_id: doc_id }, reserve_status: true }
      )
      .then(roomRes => {
        resolve(roomRes);
      }).catch(roomErr => reject(roomErr))
  })
}
//todo update hooks add more to the reservation ids inside all other models
//todo set time limit for payment to reach other thatn that suspend reservation
//todo suspend remove reservation ids from all other models and hold the reservation untill certain date waiting for payment
//todo cancel remove reservation ids from all other models

//! No Delete for this model


module.exports = mongoose.model('Reservation', schema)