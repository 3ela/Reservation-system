var express = require('express');
var router = express.Router();

router.post('/', (req, res, next) => {
  
});

router.post('/create', (req, res, next) => {

  //* check for hotel
  //* check for room && check for availability
  //* check for transportation && check for capacity

  //? for each reserve there must be at least a transportaion, 
  //? room or full trip ID.

  
});

module.exports = router;