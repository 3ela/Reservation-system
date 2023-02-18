// modules
const express = require('express');
require('dotenv').config({ path: `.env.${process.env.APP_ENV}` });
const logger = require('./config/winston');
const morgan = require('morgan');
var cors = require('cors');
var corsOptions = require('./config/cors');
const { currentDate } = require('./scripts/helpers');
const DBObj = require('./config/db');


//* app related
const app = express();
const port = process.env.PORT;


//* middlewares
app.use(morgan('dev'));
app.use(express.json());
app.use(cors(corsOptions));
app.use(express.static('uploads/images'));

//* DB connection
app.use(DBObj.mongooseInitMW())

//* Routes
var UsersRoute = require('./api/users.js');
var RolesRoute = require('./api/roles.js');

var HotelsRoute = require('./api/hotels.js');
var RoomsRoute = require('./api/rooms.js');
var AmentiesRoute = require('./api/amenities.js');

var TripsRoute = require('./api/trips.js');
var ReservationsRoute = require('./api/reservations.js');

var TranportationsRoute = require('./api/transportations.js');
var PlacesRoute = require('./api/places.js');
var RoutesRoute = require('./api/routes.js');

app.use('/users', UsersRoute);
app.use('/roles', RolesRoute);

app.use('/hotels', HotelsRoute);
app.use('/rooms', RoomsRoute);
app.use('/amenities', AmentiesRoute);

app.use('/trips', TripsRoute);
app.use('/reservations', ReservationsRoute);

app.use('/transportations', TranportationsRoute);
app.use('/places', PlacesRoute);
app.use('/routes', RoutesRoute);

// ! route access middleware
// router.stack
// let CurrentRoutes = app._router.stack.filter(router => router.name == 'router');
// CurrentRoutes.forEach(el => {
//   let routestack = el.handle.stack;
//   let routename = el.regexp.toString().split('/')[2].slice(0, -1);
//   // console.log("el.handle.stack", el.regexp.toString().split('/')[2].slice(0, -1))
//   routestack.forEach(stack => {
//     console.log("routestack", {
//       path: routename+stack.route.path,
//       method: Object.keys(stack.route.methods)[0]
//     })

//   })
// })

//* Unknown Route handler
app.get('*', (req, res, next) => {
  res.status(404).json({
    msg: 'Route Not Found'
  });
  logger.info(`req ${req.method} @ ${req.originalUrl}`);
});

//* error handler
app.use((error, req, res, next) => {
  // console.log("app.use => error", error.cause)
  if(error) {
    console.log('Server Error :', error)
    logger.error('Error :', error)
    if(error.msg) {
      res.status(400).json({
        error
      });
    } else if(error.cause) {
      res.status(400).json({
        msg: `${error.message || error.msg}`,
        error: {...error.cause}
      })
    } else {
      res.status(500).json({
        msg: `Internal Server Error: ${error.message || error.msg}`,
        error
      })
    }
  }
})

//* Server start
app.listen(port, () => {
  var ListenDate = currentDate();
  // console.log(`Listening on port ${port} at ${ListenDate}`)
  logger.notice(`Listening on port ${port} at ${ListenDate}`)
})