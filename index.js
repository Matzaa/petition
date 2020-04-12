const express = require("express");
const app = express();
const db = require("./db");
const hb = require("express-handlebars");
const cookieParser = require("cookie-parser");

app.engine("handlebars", hb());
app.set("view engine", "handlebars");
app.use(cookieParser());
app.use(
    express.urlencoded({
        extended: false,
    })
);

app.use(express.static("./public"));

app.get("/", (req, res) => {
    res.redirect("./petition");
});

app.get("/petition", (req, res) => {
    res.render("petition", {
        layout: "main",
    });
});

app.post("/petition", (req, res) => {
    if (!req.body.first || !req.body.last || req.body.signature == "") {
        res.render("./petition", { somethingwrong: true });
    } else {
        res.cookie("authenticated", true);
        db.addSignature(req.body.first, req.body.last, req.body.signature)
            .then(() => {
                console.log("it worked!");
            })
            .catch((err) => {
                console.log("err in addSig", err);
            });
        res.redirect("./thanks");
    }
    console.log("names", req.body.first, req.body.last);
});

app.get("/thanks", (req, res) => {
    if (!req.cookies.authenticated) {
        res.redirect("/petition");
    } else {
        res.render("thankyou", {
            layout: "main",
            allSigners: signersNames,
            lastOne: lastPerson,
        });
    }
});

app.get("/signers", (req, res) => {
    if (req.cookies.authenticated) {
        // db.getNames()
        //     .then((results) => {
        // console.log("getNames results", results.rows[3]);
        // var rows = results.rows;
        // var signersNames = [];
        // for (var i = 0; i < rows.length; i++) {
        //     var fullName = rows[i].first + rows[i].last;
        //     signersNames.push(fullName);
        // }
        res.render("signers", {
            layout: "main",
            allSigners: signersNames,
        });
        // })
        // .catch((err) => {
        //     console.log("err in getSig", err);
        // });
    } else {
        res.redirect("/petition");
    }
});

var signersNames = [];
var lastPerson = [];
db.getNames()
    .then((results) => {
        console.log("getNames results", results.rows[3]);
        var rows = results.rows;
        var indexNum = results.rows.length - 1;
        console.log("indexNum", indexNum);
        lastPerson.push(results.rows[indexNum].first);
        console.log(
            "results.rows[indexNum].first",
            results.rows[indexNum].first
        );
        for (var i = 0; i < rows.length; i++) {
            var fullName = { first: rows[i].first, last: rows[i].last };
            signersNames.push(fullName);
        }
    })
    .catch((err) => {
        console.log("err in getSig", err);
    });

//-----------------PRACTICE-------------------
// app.use(express.static("./public"));

// app.get("/", (req, res) => {
//     console.log("get request to/ route happend");
// });

// app.get("/page", (req, res) => {
//     db.getActors()
//         .then((results) => {
//             console.log("results", results);
//         })
//         .catch((err) => {
//             console.log("err in getciti", err);
//         });
// });

// app.post("/add-actor", (req, res) => {
//     db.addActor("Julia Roberts", 25, 3)
//         .then(() => {
//             console.log("it worked!");
//         })
//         .catch((err) => {
//             console.log("err in addActor", err);
//         });
// });

app.listen(8080, () => console.log("petition server listening"));
