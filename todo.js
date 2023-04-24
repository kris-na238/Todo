const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const mongodb = require("mongodb");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const jwtSecretKey = "MyNameisKrishna%#!@#";

async function dbConnection(req, res, next) {
    if (global['db']) {
        next();
    } else {
        let client = await mongodb.MongoClient.connect("mongodb://localhost:27017");
        if (client.db){
            console.log("cnnected to db");
            global['db'] = client.db("Todo"); // will create a database instance and store it in global variable
            next();
        }
        else {
            throw {error: "coudn't connect to db"}
        }
    }
}

app.use(dbConnection);  
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json({ limit: '110mb' }));
app.use(cookieParser());


app.get("/logout",async function(req, res, next){
    res.clearCookie("login_token");
    res.json({result:"logged out successful.", code:1})
})

app.post("/login",async function(req, res, next){
    let {email, password} = req.body;
    let db = global["db"];
    let user = await db.collection("Users").findOne({email:email,password:password});
    if(!user){
        res.json({result:"Login failed", code : 0})
    }
    else{
        
        let data = {
            loginTimeStamp: new Date(),
            user_email: email,
            id : user._id,
            gender :user.gender
        }
        const token = jwt.sign(data, jwtSecretKey);
        res.cookie("login_token", token);
        res.json({result:"login successful" ,code:1});
    }
})

app.post("/register",async function(req, res, next){
    let user = req.body;
    let db = global["db"];
    await db.collection("Users").insertOne(user);
    res.json({result:"successful"});
})


app.use(function(req, res, next){
    let cookies  = req.cookies;
    if (!cookies.login_token) return res.json({message: "No token Found."});
    const verified = jwt.verify(cookies.login_token, jwtSecretKey);
    if (verified) {
        next();
    }
    else {
        res.json({message:"Invalid Token"});
    }
})

app.post("/updatetask",async function(req, res, next){
    let {taskid, updatedTask} = req.body;
    let db = global["db"];
    await db.collection("Tasks").updateOne({_id:new mongodb.ObjectId(taskid)},{"$set":updatedTask});
    res.json({result:"successful"});
})


app.delete("/deletetask",async function(req, res, next){
    let taskid = req.body.taskid;
    let db = global["db"];
    await db.collection("Tasks").deleteOne({_id:new mongodb.ObjectId(taskid)});
    res.json({result:"successful"});
})


app.get("/gettasks",async function(req, res, next){
        let db = global["db"];
        let tasks = await db.collection("Tasks").find().toArray();
        res.json({result:"successful", data:tasks});
})

app.post("/createtask",async function(req, res, next){
        let task = req.body;
        let db = global["db"];
        await db.collection("Tasks").insertOne(task);
        res.json({result:"successful", code : 1});
})

//FIRST API
app.get("/", function(req, res, next){
    res.send("Hello There! hOW ARE YOU ")
})

// CREATE SERVER
app.listen(5000, function(){
    console.log("server is running at http://localhost:5000")
})


// post , put , patch, delete