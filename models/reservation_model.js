var mongoose = require('mongoose');
let Schema = mongoose.Schema;

const { HotelModel, RoomModel, checkRoomInHotel } = require('./hotel_room_models');
const { TransportationModel, checkForTransportationCapacity } = require('./transportation_route_models');

const schema = new Schema({
  period: {
    start_date: {
      type: Date,
    },
    end_date: {
      type: Date,
    },
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
  rooms_ids: [{
    type: Schema.Types.ObjectId,
    ref: 'Room'
  }],
  hotel_id: {
    type: Schema.Types.ObjectId,
    ref: 'Hotel'
  },
  trip_id: {
    type: Schema.Types.ObjectId,
    ref: 'Trip'
  },
  payment_id: {
    type: Schema.Types.ObjectId,
    ref: 'Payment'
  },
  transportation_id: {
    type: Schema.Types.ObjectId,
    ref: 'Transportation'
  },
  
  
},
{ 
  timestamps: {
    createdAt: 'created_at', 
    updatedAt: 'updated_at'
  }
});

//* check for room && check for availabilit
//* check for transportation && check for capacity

//? for each reserve there must be at least a transportaion, 
//? room or full trip ID.

schema.pre('save', function(next) {
  let payload = this; 

  //* reserve rooms only
  if(
      payload.reserve_module == 'rooms' && payload.hotel_id && payload.rooms_ids
      && !payload.transportation_id && !payload.trip_id  
    ) {
    //* check for hotel and rooms exist on it
    checkRoomInHotel('', payload.hotel_id, payload.rooms_ids)
    .then(checkRes => {
      if(checkRes == null) {
        next({
          msg: ` Some of the Rooms Ids Are Not found on the Hotel `,
          err: findRes
        })
      }else {
        //* all rooms exist on the hotel
        //! check for rooms availability before reservation
        console.log("schema.pre => checkRes", checkRes)
        checkRes.rooms_ids.forEach(room => {
          if(room.reserve_status == true) {
            next({
              msg: `Room already reserved`,
              room_id: room.id
            })
          }
        })
        next();
      }
    })

    //* reserve OneDay trip only
  }else if(
      payload.reserve_module == 'transports' && payload.transportation_id 
      && !payload.trip_id && !payload.hotel_id && !payload.rooms_ids
    ) {

    checkForTransportationCapacity(payload.transportation_id) 
      .then(checkRes => {
        next();
      }).catch(checkErr => next(checkErr))

    //* reserve a full trip
  }else if(
    payload.reserve_module == 'trips' && payload.trip_id
    && !payload.transportation_id && !payload.hotel_id && !payload.rooms_ids
  ) {
    let roomsPromise = checkRoomInHotel('', payload.hotel_id, payload.rooms_ids);
    let transportsPromise = checkForTransportationCapacity(payload.transportation_id);
    
    Promise.all([roomsPromise, transportsPromise])
      .then(values => {
        console.log("schema.pre => values", values)
      }).catch(valErr => next(valErr))
  }else {
    if(payload.reserve_module == 'rooms' && !(payload.hotel_id || !payload.rooms_ids)) {
      next({
        msg: `Reservation needs data Hotel/Rooms IDs on Rooms Module`,
        data: payload
      })
    } else if(payload.reserve_module == 'transports' && !payload.transportation_id ) {
      next({
        msg: `Reservation needs data Transportation ID on Transports Module`,
        data: payload
      })
    }else if(payload.reserve_module == 'trips' && !payload.transportation_id || !payload.rooms_ids || !payload.hotel_id) { 
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
//? make sure the rooms and the transports from the same module as the reservation

schema.post('save', function(doc, next) {
  //* add reserve_id to all object exists on the created shit
  if(doc.reserve_module == 'rooms') {
    HotelModel.findOneAndUpdate({ _id: doc.hotel_id}, { $push: { reservations_ids: doc.id}})
      .then(hotelRes => {
        RoomModel.updateMany({ _id: { $in: [...doc.rooms_ids]}}, { $push: { reservation_id: doc.id, reserve_status: true } })
          .then(roomRes => {
            next()
          }).catch(roomErr => next(roomErr))
        }).catch(hotelErr => next(hotelErr))
  }else if(doc.reserve_module == 'transports') {
    TransportationModel.findOneAndUpdate({ _id: doc.hotel_id }, { $push: { reservations_ids: doc.id}})
      .then(trasnportRes => {
        next();    
      }).catch(trasnportErr => next(trasnportErr))
  }else if(doc.reserve_module == 'trips') {
    
  }
});

//todo update hooks add more to the reservation ids inside all other models
//todo set time limit for payment to reach other thatn that suspend reservation
//todo suspend remove reservation ids from all other models and hold the reservation untill certain date waiting for payment
//todo cancel remove reservation ids from all other models

//! No Delete for this model


module.exports = mongoose.model('Reservation', schema)