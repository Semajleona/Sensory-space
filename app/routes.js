const { ObjectId } = require('mongodb');

module.exports = function (app, passport, db) {

  // HOME PAGE ==================================================
  app.get('/', function (req, res) {
    res.render('index.ejs');
  });


  // PROFILE PAGE ===============================================
  app.get('/profile', isLoggedIn, function (req, res) {
    db.collection('activities')
      .find({ theUserId: req.user._id.toString() })
      .toArray((err, result) => {
        if (err) return res.status(500).send(err);

        res.render('profile.ejs', {
          user: req.user,
          activities: result
        });
      });
  });


  // LOGOUT =====================================================
  app.get('/logout', function (req, res) {
    req.logout(() => {
      console.log('User has logged out!');
    });

    res.redirect('/');
  });


  // MESSAGE BOARD ==============================================

  // CREATE MESSAGE
  app.post('/messages', (req, res) => {
    db.collection('messages').save({
      name: req.body.name,
      msg: req.body.msg,
      thumbUp: 0,
      thumbDown: 0
    }, (err, result) => {
      if (err) return res.status(500).send(err);

      console.log('saved to database');
      res.redirect('/profile');
    });
  });


  // THUMBS UP
  app.put('/messages', (req, res) => {
    db.collection('messages')
      .findOneAndUpdate(
        {
          name: req.body.name,
          msg: req.body.msg
        },
        {
          $set: {
            thumbUp: req.body.thumbUp + 1
          }
        },
        {
          sort: { _id: -1 },
          upsert: true
        },
        (err, result) => {
          if (err) return res.status(500).send(err);
          res.send(result);
        }
      );
  });


  // THUMBS DOWN
  app.put('/messages/down', (req, res) => {
    db.collection('messages')
      .findOneAndUpdate(
        {
          name: req.body.name,
          msg: req.body.msg
        },
        {
          $set: {
            thumbDown: req.body.thumbDown + 1
          }
        },
        {
          sort: { _id: -1 },
          upsert: true
        },
        (err, result) => {
          if (err) return res.status(500).send(err);
          res.send(result);
        }
      );
  });


  // DELETE MESSAGE
  app.delete('/messages', (req, res) => {
    db.collection('messages').findOneAndDelete(
      {
        name: req.body.name,
        msg: req.body.msg
      },
      (err, result) => {
        if (err) return res.status(500).send(err);

        res.send('Message deleted!');
      }
    );
  });


  // SENSORY ACTIVITIES =========================================

  // CREATE ACTIVITY
  app.post('/activities', isLoggedIn, (req, res) => {
    db.collection('activities').save({
      nameOfActivity: req.body.nameOfActivity,
      description: req.body.description,
      theUserId: req.user._id.toString()
    }, (err, result) => {
      if (err) return res.status(500).send(err);

      console.log('saved to database');
      res.redirect('/profile');
    });
  });


  // DELETE ACTIVITY
  app.post('/activities/delete', isLoggedIn, (req, res) => {
    db.collection('activities').findOneAndDelete(
      {
        _id: ObjectId(req.body.id),
        theUserId: req.user._id.toString()
      },
      (err, result) => {
        if (err) return res.status(500).send(err);

        res.redirect('/profile');
      }
    );
  });


  // UPDATE ACTIVITY
  app.post('/activities/update', isLoggedIn, (req, res) => {

    console.log('FORM DATA:', req.body);

    db.collection('activities').findOneAndUpdate(
      {
        _id: ObjectId(req.body.id),
        theUserId: req.user._id.toString()
      },
      {
        $set: {
          nameOfActivity: req.body.nameOfActivity,
          description: req.body.description
        }
      },
      (err, result) => {
        if (err) return res.status(500).send(err);

        console.log('UPDATE RESULT:', result);
        res.redirect('/profile');
      }
    );
  });


  // LOGIN ======================================================

  // SHOW LOGIN PAGE
  app.get('/login', function (req, res) {
    res.render('login.ejs', {
      message: req.flash('loginMessage')
    });
  });


  // PROCESS LOGIN
  app.post('/login', passport.authenticate('local-login', {
    successRedirect: '/profile',
    failureRedirect: '/login',
    failureFlash: true
  }));


  // SIGNUP =====================================================

  // SHOW SIGNUP PAGE
  app.get('/signup', function (req, res) {
    res.render('signup.ejs', {
      message: req.flash('signupMessage')
    });
  });


  // PROCESS SIGNUP
  app.post('/signup', passport.authenticate('local-signup', {
    successRedirect: '/profile',
    failureRedirect: '/signup',
    failureFlash: true
  }));


  // UNLINK ACCOUNT =============================================
  app.get('/unlink/local', isLoggedIn, function (req, res) {
    var user = req.user;

    user.local.email = undefined;
    user.local.password = undefined;

    user.save(function (err) {
      if (err) return res.status(500).send(err);

      res.redirect('/profile');
    });
  });

};


// CHECK IF USER IS LOGGED IN ================================
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }

  res.redirect('/');
}