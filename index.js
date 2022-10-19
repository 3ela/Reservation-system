// modules
const express = require('express');
const logger = require('./config/winston');
const morgan = require('morgan');
var cors = require('cors');
var corsOptions = require('./config/cors');
const { currentDate } = require('./scripts/helpers');
require('dotenv').config();


// app related
const app = express();
const port = process.env.PORT;

// DB Connection
const DB = require('./config/db');


// middlewares
app.use(morgan('dev'));
app.use(express.json());
app.use(cors(corsOptions));
app.use(express.static('uploads/images'));

//! DB connection
// app.use(DBObj.getDBMW('users'))

// Routes
var UsersRoute = require('./api/users.js');
var RolesRoute = require('./api/roles.js');

var HotelsRoute = require('./api/hotels.js');
var RoomsRoute = require('./api/rooms.js');
var AmentiesRoute = require('./api/amenities.js');

var TranportationsRoute = require('./api/transportations.js');

app.use('/users', UsersRoute);
app.use('/roles', RolesRoute);

app.use('/hotels', HotelsRoute);
app.use('/rooms', RoomsRoute);
app.use('/amenities', AmentiesRoute);

app.use('/transportations', TranportationsRoute);

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
// Unknown Route handler

app.get('*', (req, res, next) => {
  res.status(404).json({
    msg: 'Route Not Found'
  });
  logger.info(`req ${req.method} @ ${req.originalUrl}`);
});

// error handler
app.use((error, req, res, next) => {
  if(error) {
    console.log('Server Error :', error)
    logger.error('Error :', error)
    if(error.msg) {
      res.status(400).json({
        error
      });
    }
    res.status(500).json({
      msg: `Internal Server Error: ${error.message || error.msg}`,
      error
    })
  }
})

// Server start
app.listen(port, () => {
  var ListenDate = currentDate();
  console.log(`Listening on port ${port} at ${ListenDate}`)
  logger.notice(`Listening on port ${port} at ${ListenDate}`)
})