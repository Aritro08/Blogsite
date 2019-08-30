var express = require("express"),
	mongoose = require("mongoose"),
	bodyParser = require("body-parser"),
	methodOverride = require("method-override"),
	app = express();

app.set("view engine", "ejs");
mongoose.connect("mongodb://localhost:27017/Blog1", {useNewUrlParser:true});
app.use(bodyParser.urlencoded({extended:true}));
app.use(methodOverride("_method"));

var blogSchema = new mongoose.Schema({
	name: String,
	image: String,
	body: String,
	date: {type: Date, default: Date.now}
});
var Blog = new mongoose.model("Blog", blogSchema);

app.get("/", function(req, res){
	
	res.redirect("blog");
});

app.get("/blog", function(req, res){

	Blog.find({},function(err, blogs){
		if(err)
		{
			console.log(err);
		}
		else
		{
			res.render("blog", {blogs: blogs});
		}
	});
});

app.get("/blog/new",function(req, res){

	res.render("new");
});

app.post("/blog",function(req, res){

	Blog.create(req.body.blog, function(err, newBlog){
		if(err)
		{
			console.log(err);
		}
		else
		{
			res.redirect("blog");
		}
	});
});

app.get("/blog/:id",function(req, res){

	Blog.findById(req.params.id,function(err,slblog){
		if(err)
		{
			console.log(err);
		}
		else
		{
			res.render("show",{blog: slblog});
		}
	});
});

app.get("/blog/:id/edit", function(req, res){

	Blog.findById(req.params.id, function(err, foundBlog){
		if(err)
		{
			console.log(err);
		}
		else
		{
			res.render("edit",{blog: foundBlog});
		}
	});

});

app.put("/blog/:id", function(req, res){

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

app.delete("/blog/:id", function(req, res){

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

var port = process.env.PORT || 3000;
app.listen(port, function(){
	console.log("Server has started");
});