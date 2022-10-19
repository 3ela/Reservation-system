const { check, body, validationResult } = require('express-validator');

const errorFormatter = ({ location, msg, param, value, nestedErrors }) => {
  // Build your resulting errors however you want! String, object, whatever - it works!
  return `[${param}]: ${msg}`;
};


validatorsObj = {
  validateReq: (req, res) => {
    let result = validationResult(req).formatWith(errorFormatter);
    if(!result.isEmpty()) {
      res.status(401).json({
        msg: 'data invalid',
        ...result.mapped()
      })
    }
  },

  signupValidations: [
    check('name', 'name is required').not().isEmpty(),
    check('email', 'Your email is not valid').not().isEmpty().isEmail(),
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
  permissionValidations: [
    // check('name', 'name is required').not().isEmpty(),
  ],
  hotelValids: [
    check('name', 'name is required').not().isEmpty(),
    check('city', 'city is required').not().isEmpty(),
  ],
  roomValids: [
    check('number', 'number is required').not().isEmpty(),
    check('guest_capacity', 'guest capacity is required').not().isEmpty(),
    check('price_per_night', 'price per night is required').not().isEmpty(),
    check('hotel_id', 'hotel id night is required').not().isEmpty(),
  ],
  roomDeleteManyValids: [
    check('rooms_ids', 'room\'s ids is required').not().isEmpty(),
  ],
  amenityValids: [
    // check('number', 'number is required').not().isEmpty(),

  ]
};

module.exports = validatorsObj;