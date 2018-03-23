var express = require("express");
var router = express.Router({ mergeParams: true });
var Campground = require("../models/campground");
var middleware = require("../middleware");
var multer = require("multer");

//multer config
var storage = multer.diskStorage({
    filename: function(req, file, cb) {
        cb(null, Date.now() + file.originalname);
    }
});
var imageFilter = function(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files allowed'), false);
    }
    cb(null, true);
}
var upload = multer({ storage: storage, fileFilter: imageFilter });

//cloudinary config
var cloudinary = require("cloudinary");
cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

//index route - show all campgrounds
router.get('/', function(req, res) {
    if (req.query.search) {
        const regex = new RegExp(escapeRegex(req.query.search), 'gi');
        console.log(regex)
        Campground.find({ name: regex }, function(err, campgrounds) {
            if (err) {
                console.log(err);
                req.flash("error", err.message);
                return res.redirect('back')
            }
            else if (campgrounds.length < 1) {
                req.flash('error', 'No campgrounds found')
                return res.redirect('back');
            }
            res.render('campgrounds/index', { campgrounds: campgrounds });
        });
    }
    else {
        //get all campgrounds from DB
        Campground.find({}, function(err, allCampgrounds) {
            if (err) {
                console.log(err);
                req.flash("error", err.message);
            }
            else {
                res.render('campgrounds/index', { campgrounds: allCampgrounds, currentUser: req.user });
            }
        });
    }
});

//create route
router.post('/', middleware.isLoggedIn, upload.single('fileImage'), function(req, res) {
    cloudinary.v2.uploader.upload(req.file.path, function(err, result) {
        if (err) {
            req.flash('error', err.message);
            return res.redirect('back');
        }
        // add cloudinary url for the image to the campground object under image property
        req.body.campground.image = cloudinary.url(result.public_id, { width: 1920, height: 1700, crop: 'lfill' });
        console.log(req.body.campground.image)
        // add image's public_id to campground object for deleting later
        req.body.campground.image_id = result.public_id;

        // add author
        req.body.campground.author = {
            id: req.user._id,
            username: req.user.username
        };

        Campground.create(req.body.campground, function(err, campground) {
            if (err) {
                req.flash('error', err.message);
                return res.redirect('back');
            }
            res.redirect('/campgrounds/' + campground.id);
        });
    });
});

//new route
router.get('/new', middleware.isLoggedIn, function(req, res) {
    res.render('campgrounds/new');
});

//show route
router.get('/:id', function(req, res) {
    //find campground with provided id
    Campground.findById(req.params.id).populate('comments').exec(function(err, foundCampground) {
        if (err || !foundCampground) {
            req.flash('error', 'Campground not found')
            return res.redirect('back');
        }
        console.log(foundCampground);
        res.render('campgrounds/show', { campground: foundCampground })

    });
});

//update form route
router.get('/:id/edit', middleware.checkCampgroundOwnership, function(req, res) {
    Campground.findById(req.params.id, function(err, foundCampground) {
        res.render('campgrounds/edit', { campground: foundCampground });
    });
});
//update post route
router.put('/:id', function(req, res) {
    Campground.findByIdAndUpdate(req.params.id, req.body.campground, function(err, updatedCampground) {
        if (err) {
            req.flash('error', err.message);
            res.redirect('/campgrounds');
        }
        // delete file from cloudinary

        else {
            res.redirect('/campgrounds/' + updatedCampground._id);
        }
    });
});



// router.put("/:id", middleware.checkCampgroundOwnership, upload.single('image'), function(req, res) {
//     // if a new file has been uploaded
//     if (req.file) {
//         Campground.findById(req.params.id, function(err, campground) {
//             if (err) {
//                 req.flash('error', err.message);
//                 return res.redirect('back');
//             }
//             // delete the file from cloudinary
//             cloudinary.v2.uploader.destroy(campground.image_id, function(err, result) {
//                 if (err) {
//                     req.flash('error', err.message);
//                     return res.redirect('back');
//                 }
//                 // upload a new one
//                 cloudinary.v2.uploader.upload(req.file.path, function(err, result) {
//                     if (err) {
//                         req.flash('error', err.message);
//                         return res.redirect('back');
//                     }
//                     // add cloudinary url for the image to the campground object under image property
//                     req.body.campground.image = result.secure_url;
//                     // add image's public_id to campground object
//                     req.body.campground.image_id = result.public_id;

//                     Campground.findByIdAndUpdate(req.params.id, req.body.campground, function(err) {
//                         if (err) {
//                             req.flash('error', err.message);
//                             return res.redirect('back');
//                         }
//                         req.flash('success', 'Successfully Updated!');
//                         res.redirect('/campgrounds/' + campground._id);
//                     });
//                 });
//             });
//         });
//     }
//     else {
//         Campground.findByIdAndUpdate(req.params.id, req.body.campground, function(err) {
//             if (err) {
//                 req.flash('error', err.message);
//                 return res.redirect('back');
//             }
//             req.flash('success', 'Successfully Updated!');
//             res.redirect('/campgrounds/' + req.params.id);
//         });
//     }
// });

//delete campground route
router.delete('/:id', function(req, res) {
    Campground.findByIdAndRemove(req.params.id, function(err) {
        if (err) {
            res.redirect('/campgrounds');
        }
        else {
            res.redirect('/campgrounds');
        }
    });
});

function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
};

module.exports = router;
