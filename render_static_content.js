const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const mongodb = require("mongodb");
const path = require("path");
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

app.use("/public", express.static(path.join(__dirname, "/public")));


//FIRST API
// app.get("/welcome", function(req, res, next){
//     res.sendFile(path.join(__dirname, "/welcome.html"))
// })

app.get("/", function(req, res, next){
    res.send(`hi`)
})

// CREATE SERVER
app.listen(5000, function(){
    console.log("server is running at http://localhost:5000")
})


