const express = require("express");
const app = express();
const db = require("./db");
const hb = require("express-handlebars");
const cookieSession = require("cookie-session");
const csurf = require("csurf");
const { hash, compare } = require("./bc");

//-------------------templating engine--------------------
app.engine("handlebars", hb());
app.set("view engine", "handlebars");

//-------------------middleware---------------------------

app.use(express.static("./public"));

app.use(
    express.urlencoded({
        extended: false,
    })
);
app.use(
    cookieSession({
        secret: `I'm always angry.`,
        maxAge: 1000 * 60 * 60 * 24 * 14,
    })
);

app.use(csurf());

app.use((req, res, next) => {
    res.set("X-frame-Options", "deny");
    res.locals.csrfToken = req.csrfToken();
    next();
});

//--------------------routes-------------------------------
app.get("/", (req, res) => {
    res.redirect("./register");
});

app.get("/register", (req, res) => {
    res.render("register");
});

app.post("/register", (req, res) => {
    if (
        !req.body.first ||
        !req.body.last ||
        !req.body.email ||
        !req.body.password
    ) {
        res.render("register", { somethingwrong: true });
    } else {
        hash(req.body.password)
            .then((hashedPw) => {
                console.log("HashedPw in register", hashedPw);
            })
            .then(
                db.addUser(
                    req.body.first,
                    req.body.last,
                    req.body.email,
                    req.body.password
                )
            )
            .then((response) => {
                console.log("it worked!");
                req.session.userId = response.rows[0].id;
                console.log("with req.session.cookieset", req.session);
                res.redirect("/petition"); //redirect to petition instead of 200
            })

            .catch((err) => {
                console.log("error in POST register hash", err);
                res.render("register", { somethingwrong: true });
            });
    }
});

app.get("/login", (req, res) => {
    res.render("/login");
});

app.post("/login", (req, res) => {
    const { userId } = req.session;
    if (!req.body.email || !req.body.password) {
        res.render("/login", { somethingwrong: true });
    } else {
        db.getData(`SELECT * FROM users WHERE email = ${req.body.email}`)
            .then((results) => {
                let user = results.rows[0];
                const hashedPw = results.rows[0].password;
                compare(req.body.password, hashedPw);
            })
            .then((matchValue) => {
                if (matchValue) {
                    req.session.userId = userId;
                    res.redirect("/thanks");
                } else {
                    res.render("/login", { somethingwrong: true });
                }
            })
            .catch((err) => console.log("error in POST login compare", err));
    }
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
        db.addSignature(req.body.first, req.body.last, req.body.signature)
            .then((response) => {
                console.log("it worked!");
                req.session.cookieset = true;
                req.session.userId = response.rows[0].id;
                console.log("with req.session.cookieset", req.session);
                res.redirect("./thanks"); //first finish addsignature then render thanks
            })
            .catch((err) => {
                console.log("err in addSig", err);
            });
    }
    console.log("names", req.body.first, req.body.last);
});

app.get("/thanks", (req, res) => {
    const { cookieset, userId } = req.session;
    console.log("req.session in thanks", req.session);
    if (!userId && !cookieset) {
        res.redirect("/petition");
    } else {
        db.getData(`SELECT first, signature FROM signatures`)
            .then((results) => {
                var indexNum = results.rows.length - 1;
                var justSignedName = results.rows[indexNum].first;
                var justSignedSignature = results.rows[indexNum].signature;
                res.render("thankyou", {
                    justSignedName,
                    justSignedSignature,
                });
            })
            .catch((err) => {
                console.log("err in getSig", err);
            });
    }
});

app.get("/signers", (req, res) => {
    const { userId, cookieset } = req.session;
    if (userId && cookieset) {
        db.getData(`SELECT first, last FROM signatures`)
            .then((results) => {
                var rows = results.rows;
                var signersNames = [];
                for (var i = 0; i < rows.length; i++) {
                    var fullName = { first: rows[i].first, last: rows[i].last };
                    signersNames.push(fullName);
                }
                res.render("signers", {
                    layout: "main",
                    allSigners: signersNames,
                });
            })
            .catch((err) => {
                console.log("err in getSig", err);
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
