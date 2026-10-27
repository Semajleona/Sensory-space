
// server.js

// SETUP ======================================================================
require('dotenv').config({ path: './config/.env' });

var express = require('express');
var app = express();
var mongoose = require('mongoose');
var passport = require('passport');
var flash = require('connect-flash');

var morgan = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');

var configDB = require('./config/database.js');

var db;

// Check MongoDB environment variable
console.log("MongoDB URI exists:", !!process.env.MONGODB_URI);


// EXPRESS CONFIGURATION =======================================================

app.use(morgan('dev'));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

app.set('view engine', 'ejs');


// PASSPORT CONFIGURATION ======================================================

app.use(session({
  secret: process.env.SESSION_SECRET || 'rcbootcamp2021b',
  resave: true,
  saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

require('./config/passport')(passport);


// MONGODB CONNECTION ==========================================================

mongoose.connect(configDB.url, {
  dbName: configDB.dbName,
  useNewUrlParser: true,
  useUnifiedTopology: true
}, (err) => {

  if (err) {
    console.log("MongoDB connection failed:", err.message);

    // Show detailed connection errors
    if (err.reason && err.reason.servers) {
      err.reason.servers.forEach((server, address) => {
        console.log("Server:", address);
        console.log("Error:", server.error?.message);
      });
    }

    return;
  }

  db = mongoose.connection.db;

  console.log('Database connected:', mongoose.connection.name);

  // Load routes after database connection
  require('./app/routes.js')(app, passport, db);

});


// LAUNCH SERVER ===============================================================

const PORT = process.env.PORT || 8080;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`The magic happens on port ${PORT}`);
});
