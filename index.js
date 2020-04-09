const express = require("express");
const app = express();
const db = require("./db");

console.log("db:", db);

app.use(express.static("./public"));

app.get("/", (req, res) => {
    console.log("get request to/ route happend");
});

app.get("/page", (req, res) => {
    db.getActors()
        .then((results) => {
            console.log("results", results);
        })
        .catch((err) => {
            console.log("err in getciti", err);
        });
});

app.post("/add-actor", (req, res) => {
    db.addActor("Julia Roberts", 25, 3)
        .then(() => {
            console.log("it worked!");
        })
        .catch((err) => {
            console.log("err in addActor", err);
        });
});

app.listen(8080, () => console.log("petition server listening"));
