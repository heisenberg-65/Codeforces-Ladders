var express = require("express");
var app = express();
var request = require("request");
var handle;
var data;
var index;
var div ;
app.use(express.static("public"));
app.set("view engine", "ejs");

app.get("/", function(req, res) {
	res.render("home", {title : "Home"});
});

app.get("/getHandle", function(req, res) {
	handle = req.query.handle;
	var url = "https://codeforces.com/api/user.info?handles=" + handle;
	request(url, function(error, response, body) {
		if(!error && response.statusCode == 200) {
			var temp = JSON.parse(body);
			handle = String(temp.result[0].handle);
			res.redirect("/getData")
		}
		else {
			res.render("error", {title : "Error", message: "User not found"});
		}
	});
});

app.get("/getData", function(req, res) {
	var url = "https://codeforces.com/api/user.rating?handle=" + handle;
	request(url, function(error, response, body) {
		data = JSON.parse(body);
		ratingGraph();
		res.redirect("/show");
	});
});
var contestid =[]
var rating = []
var contest=0,maxRating=0,currRating=0;
function ratingGraph() {
	var cnt=0;
	contestid =[],rating = [];
	contest=0,maxRating=0,currRating=0;
	rating =[1500] , contestid =[0] ;
	data["result"].forEach(function(c){
			cnt++;
			contest++;
			currRating=c["newRating"];
			maxRating= Math.max(maxRating,currRating);
			contestid.push(cnt);
			rating.push(c["newRating"]);
	});											   
}

app.get("/show",function(req,res){
	res.render("curve",{ handle : handle, currRating : currRating, maxRating : maxRating,contestid 			:contestid, rating : rating , contest : contest });
	//res.redirect("/selectProblem");
});

app.get("/selectProblem", function(req, res) {
	var division = req.query.division ;
	 index = req.query.index ;
	var url = "https://codeforces.com/api/contest.list" ;
	request(url, function(error, response, body) {
		if(!error && response.statusCode == 200) {
			data = JSON.parse(body);
			 div = "Div. "+division ;
			//console.log(index);
			//console.log(div);
			searchDiv();
			res.redirect("/check2");
		}
		else {
			res.render("error", {title : "Error", message: "User not found"});
		}
	});
});
var contestdivTemp = new Set()
var contestdiv = new Set()
function searchDiv(){
	contestdiv.clear();
	contestdivTemp.clear();
	data["result"].forEach(function(cont){
		if(cont["name"].indexOf(div) !== -1 )
			contestdivTemp.add(cont["id"]);
	});
}

app.get("/check2", function(req, res) {
	var url = "https://codeforces.com/api/problemset.problems";
	request(url, function(error, response, body) {
		data = JSON.parse(body);
		allProblems();
		res.redirect("/check");
	});
});
function allProblems(){
	contestdiv.clear();
	data["result"]["problems"].forEach(function(ques){
			if(ques["index"] === index && contestdivTemp.has(ques["contestId"]))	{
				contestdiv.add(ques["contestId"]);
			}			
	});
	

}
app.get("/check", function(req, res) {
	var url = "https://codeforces.com/api/user.status?handle=" + handle;
	request(url, function(error, response, body) {
		data = JSON.parse(body);
		submissionCheck();
		res.render("problems",{contestdiv : contestdiv,index : index ,div : div,index : 			index , handle :handle});
	});
});
function submissionCheck(){
	data["result"].forEach(function(tmp){
		if(contestdiv.has(tmp.contestId) === true){
			if(tmp.verdict === "OK" && tmp["problem"].index == index){
				contestdiv.delete(tmp["contestId"]);
		   }
		   }
	});
}
app.listen(3000,function(){
	console.log("Server Started");
});
