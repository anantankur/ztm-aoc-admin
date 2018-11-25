var express = require('express'),
	app = express(),
	mongoose = require('mongoose'),
	bodyParser = require('body-parser'),
	methodOverride = require('method-override'),
	expressSanitizer = require('express-sanitizer'),
	passport = require('passport'),
	Strategy = require('passport-local').Strategy,
	db = require('./db');


//passportjs below
passport.use(new Strategy(
	function(username, password, cb) {
	    db.users.findByUsername(username, function(err, user) {
	        if (err) { return cb(err); }
	        if (!user) { return cb(null, false); }
	        if (user.password != password) { return cb(null, false); }
	        return cb(null, user);
	    });
	}
));



passport.serializeUser(function(user, cb) {
    cb(null, user.id);
});

passport.deserializeUser(function(id, done) {
    db.users.findById(id, function (err, user) {
        done(err, user);
    });
});

//check if credentials are wrong
let isWrong = false;
//port number
const port = process.env.PORT || 3001;
//express-session ss

//express-session ss local
// const secret = 'random Monster';
const secret = process.env.SECRET;


//mlab
let dbUrl = process.env.DB_URL;
mongoose.connect(dbUrl, {useNewUrlParser: true});

// for local setup
// mongoose.connect("mongodb://127.0.0.1:27017/test", {useNewUrlParser: true});

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static('public'));
app.use(methodOverride('_method'));
app.use(expressSanitizer());

app.use(require('morgan')('combined'));
app.use(require('cookie-parser')());
app.use(require('express-session')({ secret: secret, resave: false, saveUninitialized: false }));

// Initialize Passport and restore authentication state, if any, from the
// session.
app.use(passport.initialize());
app.use(passport.session());

var linkSchema = new mongoose.Schema({
    dayNumber: String,
    userid: String,
    url: String,
    userName: String,
    avatarUrl: String
});
let Snippet = mongoose.model('Snippet', linkSchema);

app.listen(port, (req, res) => {
    console.log('running on port ' + port);
});

// RESTful Routes
app.get('/', require('connect-ensure-login').ensureLoggedIn('/admin'), (req, res) => {
  	console.log('logged in');
  	res.redirect('/links');
});

// Index Route
app.get('/links', require('connect-ensure-login').ensureLoggedIn('/admin'), (req, res) => {
    Snippet.find({}, (err, blogs) => {
	    if(err){
	        console.log(err);
	        res.send('opps error')
	    } else {
	        res.render('index', {blogs: blogs});
	    }
    });
});

// FILTERED Index Route
app.get('/links/filter', require('connect-ensure-login').ensureLoggedIn('/admin'), (req, res) => {
	console.log(req.query.category)
    Snippet.find({category: req.query.category}, (err, blogs) => {
	    if(err){
	        console.log(err);
	        res.send('opps error')
	    } else {
	        res.render('index', {blogs: blogs});
	    }
    });
});

app.get('/links/new', require('connect-ensure-login').ensureLoggedIn('/admin'), (req, res) => {

	res.render('new');

});

//login route
app.get('/admin', (req, res) => {
    res.render('login', {isWrong: isWrong})
    isWrong = false;
});

//logout route
app.get('/logout', (req, res) => {

	req.logout();
  	res.redirect('/links');
})

//verification
app.post('/admin', passport.authenticate('local', { failureRedirect: '/admin' }), (req, res) => {

    res.redirect('/links');
  
});

// Edit Route
app.get('/links/:id/edit', require('connect-ensure-login').ensureLoggedIn('/admin'), (req, res) => {

	    Snippet.findById(req.params.id, (err, foundBlog) => {
		    if(err){
		        res.redirect('/links');
		    } else {
			    res.render('edit', {blog: foundBlog});
		    }
	    });

});


// Update Route
app.put('/links/:id', require('connect-ensure-login').ensureLoggedIn('/admin'), (req, res) => {
    req.body.blog.desc = req.sanitize(req.body.blog.desc);
    Snippet.findByIdAndUpdate(req.params.id, req.body.blog, (err, updatedBlog) => {
	    if(err){
	        res.redirect('/links');
	        console.log(err)
	    } else {
	        res.redirect('/links');
	    }
    });
});

// Delete Route
app.delete('/links/:id', require('connect-ensure-login').ensureLoggedIn('/admin'), (req, res) => {
    Snippet.findByIdAndRemove(req.params.id, (err) => {
	    if(err){
	        res.redirect('/links');
	    } else {
	        res.redirect('/links');
	    }
    });
});