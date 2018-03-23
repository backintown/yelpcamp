var express = require("express");
var router = express.Router({ mergeParams: true });
var passport = require("passport");
var User = require("../models/user");
var Campground = require("../models/campground");

//root route
router.get("/", function(req, res) {
    Campground.find({}, function(err, campgrounds) {
        if (err) {
            console.log(err);
            req.flash("error", err.message);
            return res.render("/");
        }
        res.render("landing", { campgrounds: campgrounds });
    });
});
//auth routes
// show register form
router.get("/register", function(req, res) {
    res.render("register");
});
//handle sign up logic
router.post("/register", function(req, res) {
    var newUser = new User({ username: req.body.username, email: req.body.email });
    User.register(newUser, req.body.password, function(err, user) {
        if (err) {
            req.flash('error', err.message);
            return res.render("register", { err: err.message });
        }
        passport.authenticate("local")(req, res, function() {
            req.flash('success', 'Welcome to YelpCamp ' + user.username);
            res.redirect("/campgrounds");
        });
    });
});

//login form route
router.get('/logins', function(req, res) {
    res.render('logins');
});
//login logic
router.post('/logins', passport.authenticate('local', {
    failureRedirect: '/logins',
    failureFlash: 'Invalid username or password'
}), function(req, res) {
    var returnTo = req.session.returnTo ? req.session.returnTo : '/campgrounds';
    delete req.session.returnTo;
    req.flash('success', 'Welcome ' + req.user.username)
    // eval(require("locus"))
    res.redirect(returnTo);
});

//logout route
router.get('/logout', function(req, res) {
    req.logout();
    req.flash('success', 'Logged out')
    res.redirect('/campgrounds');
});



module.exports = router;
