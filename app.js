var express = require("express"),
	mongoose = require("mongoose"),
	bodyParser = require("body-parser"),
	methodOverride = require("method-override"),
	passport = require("passport"),
	localStrategy = require("passport-local"),
	expressSession = require("express-session"),
	Blog = require("./models/blog.js"),
	Comment = require("./models/comments.js"),
	User = require("./models/users.js"),
	flash = require("connect-flash"),
	app = express();

app.set("view engine", "ejs");
mongoose.connect("mongodb://localhost:27017/Blog1", {useNewUrlParser:true});
app.use(bodyParser.urlencoded({extended:true}));
app.use(methodOverride("_method"));
app.use(express.static(__dirname + "/public"));
app.use(flash());
app.use(expressSession({
	secret: "qwerty",
	resave: false,
	saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req, res, next){
	res.locals.currentUser = req.user;
	res.locals.success = req.flash("success");
	res.locals.error = req.flash("error");
	next();
});

app.get("/", function(req, res){
	
	res.redirect("/blog");
});

app.get("/blog", function(req, res){

	Blog.find({},function(err, blogs){
		if(err)
		{
			console.log(err);
		}
		else
		{
			res.render("Blog/blog", {blogs: blogs});
		}
	});
});

app.get("/blog/new", checkLogin, function(req, res){
	res.render("Blog/new");
});

app.post("/blog", checkLogin, function(req, res){

	var name = req.body.name;
	var image = req.body.image;
	var body = req.body.body;
	var author = {
		id: req.user._id,
		username: req.user.username
	}
	var newBlog = {
		name : name,
		image : image,
		body : body,
		author : author
	}
	Blog.create(newBlog, function(err, newBlog){
		if(err)
		{
			console.log(err);
		}
		else
		{
			res.redirect("/blog");
		}
	});
});

app.get("/blog/:id",function(req, res){

	var id = req.params.id;
	Blog.findById(id).populate("comments").exec(function(err,slblog){
		if(err)
		{
			console.log(err);
		}
		else
		{
			res.render("Blog/show",{blog: slblog});
		}
	});
});

app.get("/blog/:id/comments/new", checkLogin, function(req, res){

	Blog.findById(req.params.id, function(err, blog){
		if(err)
		{
			console.log(err);
		}
		else
		{
			res.render("Comments/new", {blog : blog});
		}
	});
});

app.post("/blog/:id/comments", checkLogin, function(req, res){

	Blog.findById(req.params.id, function(err, blog){
		if(err)
		{
			console.log(err);
		}
		else
		{
			Comment.create(req.body.comment, function(err, comment){
				if(err)
				{
					console.log(err);
				}
				else
				{
					comment.author.id = req.user._id;
					comment.author.username = req.user.username;
					comment.save();
					blog.comments.push(comment);
					blog.save();
					res.redirect("/blog/" + blog.id);
				}
			});
		}
	});
});

app.get("/blog/:id/comments/:comment_id/edit", function(req, res){
	Blog.findById(req.params.id, function(err, blog){
		if(err)
		{
			console.log(err);
		}
		else
		{
			Comment.findById(req.params.comment_id, function(err, comment){
				if(err)
				{
					console.log(err);
				}
				else
				{
					res.render("Comments/edit", {blog: blog, comment: comment});
				}
			});
		}
	});
});

app.put("/blog/:id/comments/:comment_id", function(req, res){
	Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment, function(err, comment){
		if(err)
		{
			console.log(err);
		}
		else
		{
			res.redirect("/blog/" + req.params.id);
		}
	});
});

app.delete("/blog/:id/comments/:comment_id", function(req, res){
	Comment.findByIdAndRemove(req.params.comment_id, function(err){
		if(err)
		{
			console.log(err);
		}
		else
		{
			res.redirect("/blog/" + req.params.id);
		}
	});
});

app.get("/blog/:id/edit", checkAuth, function(req, res){

	Blog.findById(req.params.id, function(err, foundBlog){
		if(err)
		{
			console.log(err);
		}
		else
		{
			res.render("Blog/edit",{blog: foundBlog});
		}
	});

});

app.put("/blog/:id", checkAuth, function(req, res){

	Blog.findByIdAndUpdate(req.params.id, req.body.blog, function(err, updatedBlog){
		if(err)
		{
			console.log(err);
		}
		else
		{
			res.redirect("/blog/"+req.params.id);
		}
	});
});

app.delete("/blog/:id", checkAuth, function(req, res){

	Blog.findByIdAndRemove(req.params.id, function(err){
		if(err)
		{
			console.log(err);
		}
		else
		{
			res.redirect("/blog");
		}
	});
});

app.get("/register", function(req, res){
	res.render("Auth/register");
});

app.post("/register", function(req, res){
	var username = new User({ username: req.body.username});
	User.register(username, req.body.password, function(err, user){
		if(err)
		{
			console.log(err);
			req.flash("error", err.message);
			res.redirect("/register");
		}
		else
		{
			passport.authenticate("local")(req, res, function(){
				req.flash("success", "Welcome to The_Blog " + user.username + "!");
				res.redirect("/blog");
			})
		}
	});
});

app.get("/login", function(req, res){
	res.render("Auth/login");
});

app.post("/login", passport.authenticate("local", {
	successRedirect: "/blog",
	failureRedirect: "/login"
}), function(req, res){
});

app.get("/logout", function(req, res){
	req.logout();
	req.flash("success", "Successfully logged out");
	res.redirect("/blog");
});

function checkLogin(req, res, next)
{
	if(req.isAuthenticated())
	{
		return next();
	}
	req.flash("error", "You must be logged in to do that")
	res.redirect("/login");
}

function checkAuth(req, res, next)
{
	if(req.isAuthenticated())
	{
		Blog.findById(req.params.id, function(err, blog){
			if(err)
			{
				console.log(err);
			}
			else
			{
				if(blog.author.id.equals(req.user._id))
				{
					next();
				}
				else
				{
					res.redirect("back");
				}
			}
		});
	}
}

var port = process.env.PORT || 3000;
app.listen(port, function(){
	console.log("Server has started");
});