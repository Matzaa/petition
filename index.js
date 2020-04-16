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

//=============================
//====    register   ==========
//=============================
app.get("/register", (req, res) => {
    console.log("req.session", req.session);
    if (req.session.userId) {
        res.redirect("/login");
    } else {
        res.render("register");
    }
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
                return db.addUser(
                    req.body.first,
                    req.body.last,
                    req.body.email,
                    hashedPw
                );
            })
            .then((response) => {
                console.log("registering worked!");
                console.log("response in post reg", response);
                req.session.userId = response.rows[0].id;
                console.log(
                    "POST register - with req.session.userId = response.rows[0].id",
                    req.session
                );
                res.redirect("/petition"); //redirect to petition instead of 200
            })

            .catch((err) => {
                console.log("error in POST register hash", err);
                res.render("register", { somethingwrong: true });
            });
    }
});

//===========================
//====    login    ==========
//===========================

app.get("/login", (req, res) => {
    res.render("/login");
});

app.post("/login", (req, res) => {
    const { userId } = req.session;
    let id;
    if (!req.body.email || !req.body.password) {
        res.render("/login", { somethingwrong: true });
    } else {
        db.getData(`SELECT * FROM users WHERE email = ${req.body.email}`)
            .then((results) => {
                const hashedPw = results.rows[0].password;
                id = results.rows[0].id;
                compare(req.body.password, hashedPw);
            })
            .then((matchValue) => {
                if (matchValue) {
                    req.session.userId = id;

                    console.log(
                        "POST login current id & req.session & userId",
                        id,
                        req.session,
                        userId
                    );
                    // do a db query to find out if they've signed
                    // if yes, you want to put their sigId in a cookie & redirect to /thanks
                    // if not, redirect to /petition
                    res.redirect("/thanks");
                } else {
                    res.render("/login", { somethingwrong: true });
                }
            })
            .catch((err) => console.log("error in POST login compare", err));
    }
});

//=========================
//====    sign   ==========
//=========================

app.get("/petition", (req, res) => {
    if (req.session.userId) {
        const { userId } = req.session;
        db.getData(`SELECT * FROM users WHERE id = ${userId}`)
            .then((results) => {
                let firstName = results.rows[0].first;
                let lastName = results.rows[0].last;
                res.render("./petition", {
                    firstName,
                    lastName,
                });
            })
            .catch((err) => {
                console.log("err in petition render", err);
            });
    } else {
        res.redirect("/register");
    }
});

app.post("/petition", (req, res) => {
    if (req.body.signature == "") {
        res.render("./petition", { somethingwrong: true });
    } else {
        const { userId } = req.session;
        console.log("userId", userId);
        db.addSignature(req.body.signature, userId)
            .then(() => {
                console.log("signature added!");
                req.session.signed = true;
                console.log("with req.session.signed", req.session);
                res.redirect("./thanks"); //first finish addsignature then render thanks
            })
            .catch((err) => {
                console.log("err in addSig", err);
            });
    }
    console.log("names", req.body.first, req.body.last);
});

//==============================
//====    thank you   ==========
//==============================

app.get("/thanks", (req, res) => {
    const { userId, signed } = req.session;
    console.log("req.session in thanks", req.session);
    if (!userId && !signed) {
        res.redirect("/petition");
    } else {
        db.getData(
            `SELECT signature FROM signatures WHERE user_id = ${userId} UNION SELECT first FROM users WHERE id = ${userId}`
        )
            .then((results) => {
                console.log("union results", results);
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

//=============================
//====     profile   ==========
//=============================

app.get("/profile", (req, res) => {});

app.post("/profile", (req, res) => {});

//=============================
//====    signers    ==========
//=============================

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

//should we reset the id (serial)
