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
    if (!req.body.first || !req.body.last || !req.body.signature) {
        res.render("./petition", { somethingwrong: true });
    } else {
        res.cookie("authenticated", true);
        res.redirect("./thanks");
        // db.addSignature("Julia", "Roberts", signature)
        //     .then(() => {
        //         console.log("it worked!");
        //     })
        //     .catch((err) => {
        //         console.log("err in addSig", err);
        //     });
    }
});

app.get("/thanks", (req, res) => {
    if (!req.cookies.authenticated) {
        res.redirect("/petition");
    } else {
        res.render("thankyou", {
            layout: "main",
        });
    }
});

app.get("/signers", (req, res) => {
    if (req.cookies.authenticated) {
        res.render("signers", {
            layout: "main",
            db,
        });
    } else {
        res.redirect("/petition");
    }
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
