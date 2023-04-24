const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const mongodb = require("mongodb");


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

app.get("/register", function(req, res, next){
    res.send("<center><h1>You registration is successfull.</h1></center>")
})

app.post("/login", function(req, res, next){
    let {email , password} = req.body;
    if(email=="krishna@gmail.com" && password=="12345"){
        res.json({message:"login successful"})
    }
    else res.json({message:"login failed"})
    
})

app.get("/login", function(req, res, next){
    res.send("Your  55555555 login is successfull. Thanks")
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