var mongoose = require('mongoose');
const { getDuplicateIds } = require('../scripts/helpers');

const  HotelSchema = require('./schema/hotel_schema');
const  RoomSchema = require('./schema/room_schema');

//* Hotel Model Hooks
//* ---------------

//* if user sent new rooms Or  
//* deleted some Or
//* updated some on the hotel
HotelSchema.pre('save', function (next) {
  const payload = this;
  
  if(payload.rooms && payload.rooms.length != 0) {
    //* user wanna create rooms 
    //* check for repeated numbers in the array
    const keys = payload.rooms.map(item => item['number'])
    keys.forEach(key => {
      let duplicate = getDuplicateIds(keys, key);
      if(duplicate != -1) {
        let duplicateRooms = payload.rooms.filter(room => room.number == key)
        next({
          msg: `duplicate room numbers`,
          rooms: duplicateRooms
        })
      }
    });
    next();
  } else {
    next();
  }
});

HotelSchema.post('save', function(doc, next) {
  //* create rooms in RoomModel with current hotel Id
  if(doc.rooms && doc.rooms.length != 0) {
    let createRooms = doc.rooms.map(room => {
      return {
        ...room, 
        hotel_id: doc.id
      }
    })
    RoomModel.create(createRooms)
    .then(createRes => {
      //* add created ids into rooms_ids
      doc.rooms_ids = createRes.map(room => room.id)
      doc.rooms = undefined;
      next();
    }).catch(createErr => next(createErr))
  } else {
    next();
  }
})

HotelSchema.pre('findOneAndUpdate', async function(next) {
  
  const findRes = await this.model.findOne(this.getQuery());
  const payload = this._update;

  if(payload.rooms && payload.rooms.length != 0) {
    let updateRooms = [],
        deleteRooms = [], 
        createRooms = [];

    payload.rooms.forEach(room => {
      if (room.id && room.delete == true) {
        deleteRooms.push(room.id);
      } else if(room.id && !room.delete) {
        updateRooms.push({
          updateOne: {
            filter: { _id: room.id },
            update: room,
          }
        });
        if(!findRes.rooms_ids.includes(room.id)) {
          next({
            msg: `Room does not exist in this hotel`,
            room
          })
        }
      } else {
        createRooms.push({
          ...room,
          hotel_id: findRes.id
        });
      }
    });

    await RoomModel.create(createRooms)
      .then(createRes => {})
      .catch(createErr => next(createErr));

    await RoomModel.bulkWrite([...updateRooms])
      .then(updateRes => {
        console.log("HotelSchema.pre => updateRes", updateRes)
        if(updateRes.hasWriteErrors()) {
          next({
            msg: `error updating hotel rooms`,
            err: updateRes.writeErrors
          })
        }
      }).catch(createErr => next(createErr))

    await RoomModel.deleteMany({ _id: {$in: deleteRooms} })
      .then(deleteRes => {
        payload.rooms = undefined;
        next();
      })
      .catch(createErr => next(createErr))
  }
  
});

//* ---------------
//* Room Model Hooks
//* ---------------
RoomSchema.pre(['save'], function (next) {
  //* find Item by Id
  HotelModel.findById(this.hotel_id, 'name _id')
  .populate({
    path: 'rooms_ids',
    match: {
      number: this.number
    }
  })
  .exec((findErr, findRes) => {
    if(findErr) {
      console.log(".exec => findErr", findErr)
      next(findErr)
    }else if (findRes == null) {
      next({ Error: 'hotel doesnt exist'})
    } else if (findRes.rooms_ids.length == 0) {
      //* Room Doesn't exist
      next()
    }else {
      next({
        msg: `Room Exists on hotel`,
        hotel: findRes
      })
    }
  })
})

RoomSchema.post(['save'], function (doc, next) {
  //* update the list of rooms ids inside the hotel 
  HotelModel.findOneAndUpdate({_id: doc.hotel_id }, { $push: { rooms_ids: doc.id}})
    .then(pushUpdateRes => {
      next();
    }).catch(pushUpdateErr => next(pushUpdateErr))
})

RoomSchema.pre(['findOneAndUpdate', 'updateOne'], async function(next) {
  //! check if the room number already exists
  //* check if room existss
  const findRes = await this.model.findOne(this.getQuery());
  const payload = this._update;
  console.log('this.', payload)
  //* cehck if room exist
  findRes == null ? next('Room Does not exist') : '';
  
  if(payload.hotel_id == findRes.hotel_id) {
    if(payload.number == findRes.number) {
      //* just let it update
      next();
    }else {
      //* check if this number is not taken yet
      await checkRoomInHotel(payload.number, payload.hotel_id)
      .then(checkRes => {
        //* room doest exist on hotel
        if(checkRes == null) {
          //* just let it update
          next();
        }else {
          let E = new Error(`Room Exists`);
          next(E);
        }
      }).catch(checkErr => next(checkErr))
    }
  }else {
    await checkRoomInHotel(payload.number, payload.hotel_id)
    .then(checkRes => {
      //* room doest exist on hotel
      if(checkRes == null) {
        //* just let it update
        //* push room id in new hotel
        HotelModel.findOneAndUpdate({_id: payload.hotel_id }, { $push: { rooms_ids: payload.id}})
        .then(pushUpdateRes => {
          if(pushUpdateRes == null) {
            next({
              hotel_id: payload.hotel_id,
              message: 'New Hotel doesn\'t exist'
            })
          } else {
            next();
          }
        }).catch(pushUpdateErr => next(pushUpdateErr))
        
        //* pull room id from old hotel
        HotelModel.findOneAndUpdate({_id: findRes.hotel_id }, { $pull: { rooms_ids: payload.id}})
        .then(pushUpdateRes => {
          if(pushUpdateRes == null) {
            next({
              hotel_id: findRes.hotel_id,
              message: 'Old Hotel doesn\'t exist'
            })
          } else {
            next();
          }
        }).catch(pushUpdateErr => next(pushUpdateErr))
      }else {
        next({
          hotel: payload.hotel_id,
          message: `Room Exists on new hotel`
        });
      }
    }).catch(checkErr => next(checkErr))
  }
});

RoomSchema.post(['deleteMany', 'findOneAndDelete'], { query: true, document: false }, function(doc, next) {
  //* remove id from hotel if exist
  HotelModel.findOneAndUpdate({_id: doc.hotel_id }, { $pull: { rooms_ids: doc.id}})
  .then(pushUpdateRes => {
    next();
  }).catch(pushUpdateErr => next(pushUpdateErr))
})

function checkRoomInHotel(room_number, hotel_id, room_id) {
  return new Promise((resolve, reject) => {
    let match;
    let roomsLength = 1;

    !room_id && !room_number 
      ? reject({
          message: 'Room Number or Room Id must exist'
        })
      : '';

    if(!room_id) {
      if(!Array.isArray(room_number)) {
        match = {
          number: room_number,
        };
      }else {
        match = {
          number:  { $in: [...room_number] },
        };
        roomsLength = room_number.length;
      }
    } else {
      if(!Array.isArray(room_id)) {
        match = {
          id: room_id,
        };
      }else {
        match = {
          id:  { $in: [...room_id] },
        };
        roomsLength = room_id.length;
      }
    };

    HotelModel.findById(hotel_id, 'name _id')
    .populate({
      path: 'rooms_ids',
      match
    })
    .exec((findErr, findRes) => {
      if(findRes == null) {
        reject({
          hotel_id: hotel_id,
          msg: 'hotel doesn\'t exist'
        })
      }else if(findErr) {
        reject(findErr)
      }else {
        if (findRes?.rooms_ids.length != 0) {
          //* check if all rooms have been found 
          if(roomsLength != 1 && findRes?.rooms_ids.length != roomsLength) {
            reject({
              msg: ` Some of the Rooms Ids Are Not found on the Hotel `,
              err: findRes
            })
          } else {
            resolve(findRes);
          }
        }else {
          resolve(null)
        }
      }
    })
  })
  
};

function checkManyRoomsInHotel(hotel_id, rooms_ids, matchOpts) {
  return new Promise((resolve, reject) => {
    //* check for hotel existance
    let match = {};
    rooms_ids ? match._id = { $in: rooms_ids } : '';
    matchOpts ? match = {...match, ...matchOpts} : '';

    HotelModel.findById(hotel_id)
    .populate({
      path: 'rooms_ids',
      match
    }).exec((findErr, findRes) => {
      if(findRes == null) {
        reject({
          msg: ` hotel was not found `,
          hotel_id: hotel_id
        })  
      } else {
        //* check if number of rooms is the same
        if (findRes.rooms_ids.length > 0 &&  findRes.rooms_ids.length == rooms_ids.length) {
          resolve(findRes)
        } else {
          reject({
            msg: ` rooms data is incorrect `,
            data: findRes
          })
        }
      }
    })
  })
}



function checkAllHotelsRooms(hotels_ids, match_opts, check_total_capacity) {
  return new Promise((resolve, reject) => {
    let hotelsPromises = [];
    hotels_ids.forEach(hotel => {
      hotelsPromises.push(checkManyRoomsInHotel(hotel.id, hotel.rooms_ids, match_opts));  
    });
    Promise.all(hotelsPromises).then(values => {
      
      //* check for guest_capacity in rooms
      if(check_total_capacity) {

        //* calculate guest_capacity in rooms
        let total_guest_capacity = 0;
        values.forEach(hotel => {
          hotel.rooms_ids.reduce((total_guest_capacity, curr) => total_guest_capacity + curr);
        })

        if(total_guest_capacity >= check_total_capacity) {
          //* guest_capacity in rooms enough
          resolve({
            capacity_check: true,
            total_guest_capacity,
            values
          })
        } else if(total_guest_capacity < check_total_capacity) {
          //* guest_capacity in rooms not enough
          reject({
            msg: " Capacity Check Failed, need more guest capacity ",
            capacity_check: false,
            total_guest_capacity,
            values
          })
        }
      } else {
        //* no check for capacity
        resolve(values)
      }
    }).catch(err => reject(err))
  })
}

let HotelModel = mongoose.model('Hotel', HotelSchema);
let RoomModel = mongoose.model('Room', RoomSchema);

module.exports = {
  HotelModel,
  RoomModel,
  checkRoomInHotel,
  checkManyRoomsInHotel,
  checkAllHotelsRooms
}