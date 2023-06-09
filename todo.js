const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const mongodb = require("mongodb");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const path = require("path");
const jwtSecretKey = "MyNameisKrishna%#!@#";
const {ObjectId} = mongodb;

app.set('view engine', 'ejs');

async function dbConnection(req, res, next) {
    try{
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
    catch(e){
        console.log("error in db connection",e)
        e.errorNo =3;
        next(e)
    }
    
}

app.use(dbConnection);  
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json({ limit: '110mb' }));
app.use(cookieParser());
app.use("/public", express.static(path.join(__dirname, "/public")));


app.get("/home",async function(req, res, next){
    res.sendFile(path.join(__dirname, "/views/todo.html"))
})



app.get("/login", function(req, res, next){
    try{
        res.sendFile(path.join(__dirname, "/views/login.html"));
    }
    catch(e){
       next(e);
    }
})

app.get("/register",async function(req, res, next){
    res.sendFile(path.join(__dirname, "/views/register.html"));
})



app.post("/login",async function(req, res, next){
    let {email, password} = req.body;
    let db = global["db"];
    let user = await db.collection("Users").findOne({email:email,password:password});
    if(!user){
        res.sendFile(path.join(__dirname, "/viewserror.html"));
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
        res.redirect("/tasklist");
    }
})

app.post("/register",async function(req, res, next){
    let user = req.body;
    let db = global["db"];
    await db.collection("Users").insertOne(user);
    res.redirect("/login");
})

//authentication
app.use(function(req, res, next){
    let cookies  = req.cookies;
    if (!cookies.login_token) return res.json({message: "No token Found."});
    const verified = jwt.verify(cookies.login_token, jwtSecretKey);
    if (verified) {
        req.user = verified;
        next();
    }
    else {
        res.json({message:"Invalid Token"});
    }
})

app.get("/tasklist",async function(req, res, next){
    let user = req.user;
    let db = global["db"];
    let tasks = await db.collection("Tasks").find({user_id : new ObjectId(user.id)}).toArray();
    res.render("tasklist",{tasks, user});
    //res.json({result:"successful", data:tasks});
    //res.sendFile(path.join(__dirname, "/views/tasklist.html"));
})

app.get("/logout",async function(req, res, next){
    res.clearCookie("login_token");
    res.redirect("/home");
})

app.post("/updatetask",async function(req, res, next){
    let user = req.user;
    let {taskid, updatedTask} = req.body;
    let db = global["db"];
    let isUpdated = await db.collection("Tasks").updateOne({_id:new mongodb.ObjectId(taskid),user_id:new ObjectId(user.id)},{"$set":updatedTask});
    if(isUpdated.modifiedCount) res.json({result:"successful"});
    else res.json({result:"failed"});
    
})


app.delete("/deletetask",async function(req, res, next){
    let user = req.user;
    let taskid = req.body.taskid;
    let db = global["db"];
    let isdeleted= await db.collection("Tasks").deleteOne({_id:new mongodb.ObjectId(taskid),user_id:new ObjectId(user.id)});
    if(isdeleted.deletedCount)
    res.json({result:"successful"});
    else res.json({result:"failed"});
})


app.get("/gettasks",async function(req, res, next){
        let user = req.user;
        let db = global["db"];
        let tasks = await db.collection("Tasks").find({user_id : new ObjectId(user.id)}).toArray();
        res.json({result:"successful", data:tasks});
})

app.post("/createtask",async function(req, res, next){
    try{
        let user = req.user;
        let task = req.body;
        task["user_id"] = new ObjectId(user.id);
        let db = global["db"];
        await db.collection("Tasks").insertOne(task);
        res.json({result:"successful", code : 1});
    }
    catch(e){
        e.errorNo =2;
        next(e)
    }
        
})

//FIRST API
app.get("/", function(req, res, next){
    try{
        if(req.user)
        res.sendFile(path.join(__dirname, "/views/tasklist.html"));
        else
        res.redirect("/login");
    }
    catch(e){
       //res.send({message:"Something went wrong.Please try again."});
       e.errorNo=1;
       next(e);
    }
})


app.use(function(err, req, res, next){
    if(err.errorNo==1) res.status(500).json({error : "some error message 1"})
    else if(err.errorNo==2) res.status(500).json({error : "some error message 2"})
    else if(err.errorNo==3) res.status(500).json({error : "Some error occured in out db server, please try again."})
    else res.status(500).json({error : "some default error message "})
})

// CREATE SERVER
app.listen(5000, function(){
    console.log("server is running at http://localhost:5000")
})


// post , put , patch, delete