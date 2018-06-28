if (process.env.NODE_ENV !== 'production') {
    require('dotenv').load();
}

var express = require("express"),
    app = express(),
    bodyParser = require("body-parser"),
    mongoose = require("mongoose"),
    passport = require("passport"),
    LocalStrategy = require("passport-local"),
    methodOverride = require("method-override"),
    flash = require("connect-flash"),
    User = require("./models/user"),
    nev = require("email-verification")(mongoose);

//routes
var commentRoutes = require("./routes/comments"),
    campgroundRoutes = require("./routes/campgrounds"),
    indexRoutes = require("./routes/index");

//app config

//mongoose.connect("mongodb://localhost/yelp_camp");
mongoose.connect('mongodb://alex2:test@ds153978.mlab.com:53978/yelpcamp1234');
//mongoose.connect(process.env.DATABASEURL);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));
app.set('view engine', 'ejs');
app.use(methodOverride('_method'));
app.use(require("express-session")({
    secret: 'yelpcamp secret',
    resave: false,
    saveUninitialized: false
}));
app.use(flash());

//middleware to provide user to each view
app.use(function(req, res, next) {
    res.locals.currentUser = req.user; //locals is what's available in ejs view
    res.locals.error = req.flash('error');
    res.locals.success = req.flash('success');
    next();
});

//passport config

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// NEV configuration =====================
// nev.configure({
//     persistentUserModel: User,
//     expirationTime: 600, // 10 minutes

//     verificationURL: 'https://actest-ca219543.c9users.io/email-verification/${URL}',
//     transportOptions: {
//         service: 'Gmail',
//         auth: {
//             user: 'derpedo@gmail.com',
//             pass: 'herpedo0'
//         }
//     },
//     verifyMailOptions: {
//         from: 'Do Not Reply <user@gmail.com>',
//         subject: 'Confirm your account',
//         html: '<p>Please verify your account by clicking <a href="${URL}">this link</a>. If you are unable to do so, copy and ' +
//                 'paste the following link into your browser:</p><p>${URL}</p>',
//         text: 'Please verify your account by clicking the following link, or by copying and pasting it into your browser: ${URL}'
//     },
//     shouldSendConfirmation: true,
//     confirmMailOptions: {
//         from: 'Do Not Reply <user@gmail.com>',
//         subject: 'Successfully verified!',
//         html: '<p>Your account has been successfully verified.</p>',
//         text: 'Your account has been successfully verified.'
//     },
//     hashingFunction: myHasher,
//     passwordFieldName: 'password',
// }, function(err, options) {
//     if (err) {
//         console.log(err);
//         return;
//     }

//     console.log('configured: ' + (typeof options === 'object'));
// });

//middleware to provide user to each view
app.use(function(req, res, next) {
    res.locals.currentUser = req.user; //locals is what's available in ejs view
    res.locals.message = req.flash('error');
    next();
});

app.use('/', indexRoutes);
app.use('/campgrounds', campgroundRoutes);
app.use('/campgrounds/:id/comments', commentRoutes);
// Campground.create({
//           name: "Granite Hill", 
//           image: "https://farm1.staticflickr.com/60/215827008_6489cd30c3.jpg",
//           description: "This is a huge granite hill, no bathrooms.  No water. Beautiful granite!"
//         }, function(err, newlyCreated) {
//         if (err) {
//             console.log(err);
//         } else {
//             console.log(newlyCreated);
//         }
// });


app.listen(process.env.PORT, process.env.IP, function() {
    console.log('server started', process.env.DATABASEURL);
});
