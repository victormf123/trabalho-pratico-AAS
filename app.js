const express         =     require('express')
  , passport          =     require('passport')
  , cookieParser      =     require('cookie-parser')
  , session           =     require('express-session')
  , bodyParser        =     require('body-parser')
  , config            =     require('./configuration/config')
  , app               =     express();
var {FB, FacebookApiException} = require('fb');

var GoogleStrategy = require('passport-google-oauth20').Strategy;
var FacebookStrategy  =  require('passport-facebook').Strategy

passport.use(new GoogleStrategy({
    clientID: config.api_key,
    clientSecret: config.api_secret,
    callbackURL: config.callback_url
  },
  function(accessToken, refreshToken, profile, done) {
    return done(null, profile);
  }
));

passport.use(new FacebookStrategy({
  clientID: config.facebook_api_key,
  clientSecret:config.facebook_api_secret ,
  callbackURL: config.callback_url
},
function(accessToken, refreshToken, profile, done) {
  process.nextTick(function () {
    //Check whether the User exists or not using profile.id
    if(config.use_database) {
      // if sets to true
      pool.query("SELECT * from user_info where user_id="+profile.id, (err,rows) => {
        if(err) throw err;
        if(rows && rows.length === 0) {
            console.log("There is no such user, adding now");
            pool.query("INSERT into user_info(user_id,user_name) VALUES('"+profile.id+"','"+profile.username+"')");
        } else {
            console.log("User already exists in database");
        }
      });
    }
    return done(null, profile);
  });
}
));

// Passport session setup.
passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({ secret: 'keyboard cat', resave: true, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res){
  res.render('index', { user: req.user });
});


app.get('/auth/google', passport.authenticate('google', { scope: ['profile'] }));
app.get('/auth/facebook', passport.authenticate('facebook',{scope:'email'}));

app.get('/auth/google/callback', 
  passport.authenticate('google',  { successRedirect : '/', failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/');
  }
);
app.get('/auth/facebook/callback', 
  passport.authenticate('facebook',  { successRedirect : '/', failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/');
  }
);

app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});

app.listen(3000, () => console.log('Server up'));