const { check, body, validationResult } = require('express-validator');

const errorFormatter = ({ location, msg, param, value, nestedErrors }) => {
  // Build your resulting errors however you want! String, object, whatever - it works!
  return `[${param}]: ${msg}`;
};


validatorsObj = {
  validateReq: (req, res) => {
    let result = validationResult(req).formatWith(errorFormatter);
    if(!result.isEmpty()) {
      let ValidationErr = new Error(`Validation Err`, {cause: {...result.mapped()} });
      throw ValidationErr;
    }
  },

  signupValidations: [
    check('name', 'name is required').not().isEmpty(),
    check('email', 'Your email is not valid').not().isEmpty().isEmail().normalizeEmail(),
    check('password', 'password is invalid').not().isEmpty(),
    check('password', 'password is weak').isStrongPassword(
      { 
        minLength: 8, 
        minLowercase: 1, minUppercase: 0, 
        minNumbers: 1, minSymbols: 1, 
        returnScore: false, pointsPerUnique: 1, 
        pointsPerRepeat: 0.5, pointsForContainingLower: 10, 
        pointsForContainingUpper: 10, pointsForContainingNumber: 10,
        pointsForContainingSymbol: 10 
      }
    ),
  ],
  loginValidations: [
    check('email', 'Your email is not valid').not().isEmpty().isEmail(),
    check('password', 'password is invalid').not().isEmpty(),
  ],
  roleValidations: [
    check('name', 'name is required').not().isEmpty(),
  ], 
  hotelValids: [
    check('name', 'name is required').not().isEmpty(),
    check('city', 'city is required').not().isEmpty(),
    check('address', 'address is required').not().isEmpty(),
    // check('status', 'status is a boolean').isBoolean(),
  ],
  roomValids: [
    check('number', 'number is required').not().isEmpty().isInt(),
    check('guest_capacity', 'guest capacity is required').not().isEmpty().isInt(),
    check('price_per_night', 'price per night is required').not().isEmpty().isDecimal(),
    check('hotel_id', 'hotel id  is required').not().isEmpty(),
    check('reserve_module', 'reserve_module is not found').isIn(['rooms', 'trips']),
    // check('reserve_status', 'reserve_status is a boolean').isBoolean(),
  ],
  roomDeleteManyValids: [
    check('rooms_ids', 'room\'s ids is required').not().isEmpty(),
  ],
  amenityValids: [
    check('name', 'name is required').not().isEmpty(),
    check('unit_count', 'city is required').isInt(),
  ],
  transValids: [
    check('model', 'model is required').not().isEmpty(),
    check('model', 'model not found').isIn(['54A', '32A', '18A', '13B']),

    check('reserve_module', 'reserve_module is not found').isIn(['transports', 'trips']),
    check('capacity', 'model is a required number').not().isEmpty().isInt(),
    check('status', 'model is required').not().isEmpty(),
    check('status', 'status not found').isIn(['available', 'assigned', 'on_route', 'broken', 'getting_repaires']),

  ],
  reserveValids: [
    check('reserve_module', 'reserve_module is not found').isIn(['transports', 'trips', 'rooms']).not().isEmpty(),
    check('reserve_status', 'reserve_status is not found').isIn(['pending', 'confirmed', 'canceled']),
    check('number_of_guests', 'number_of_guests is a required number').not().isEmpty().isInt(),
    //todo date validation
  ],
  placeValids: [
    check('name', 'name is required').not().isEmpty(),
    check('coordinates.long', 'longitude must be a number').isDecimal(),
    check('coordinates.lat', 'latitude must be a number').isDecimal()

  ],
  tripValids: [
    check('price', 'price is required').not().isEmpty().isDecimal(),
    check('time_interval.start_date', 'start_date must be a date').isDate(),
    check('time_interval.end_date', 'end_date must be a date').isDate(),
    check('reservation_capacity', 'reservation_capacity must be a number').isInt(),
    check('status', 'status must be a boolean').isBoolean(),
    
    check('destination_id', 'destination_id is required').not().isEmpty(),
    check('hotels_ids', 'hotels_ids is required').not().isEmpty(),
    check('transportations_ids', 'transportations_ids is required').not().isEmpty(),

  ],
  routeValids: [
    check('time.take_off_time', 'take_off_time is required').not().isEmpty(),
    check('time.departure_time', 'departure_time must be date_time format (yyyy-mm-dd hh:mm a)').not().isEmpty(),
    check('time.departure_time', 'departure_time must be after today').isAfter( { comparisonDate: Date().toString() }),
    
    check('time.arrival_time', 'arrival_time is required').not().isEmpty(),
    check('time.arrival_time', 'arrival_time must be date_time format (yyyy-mm-dd hh:mm a)').not().isEmpty(),
    check('time.arrival_time', 'arrival_time must be after departure_time').custom((value, {req}) => value > req.body.time.departure_time),

    check('status', 'status must be a bool').isBoolean(),
    check('place_id', 'Place is required').not().isEmpty(),

  ],
};

module.exports = validatorsObj;