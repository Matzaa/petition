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
    // let first = req.body.first;
    // let last = req.body.last;
    // let email = req.body.email;
    // let pw = req.body.password;
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
                // req.session.userId = response.rows[0].id;
                req.session.user = {
                    firstName: req.body.first,
                    lastName: req.body.last,
                    userId: response.rows[0].id,
                };
                console.log(
                    "POST register - with req.session.user info",
                    req.session
                );
                res.redirect("/profile"); //redirect to petition instead of 200
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
    res.render("login");
});

app.post("/login", (req, res) => {
    const { user } = req.session;
    let id;
    console.log("req.body.password", req.body.password);
    if (!req.body.email || !req.body.password) {
        res.render("login", { somethingwrong: true });
        return;
    } else {
        db.getData(`SELECT * FROM users WHERE users.email = ${req.body.email}`) ////// NEEDS TO BE FIXED
            .then((results) => {
                const hashedPw = results.rows[0].password;
                id = results.rows[0].id;

                compare(req.body.password, hashedPw)
                    .then((matchValue) => {
                        if (matchValue) {
                            req.session.user = {
                                firstName: results.rows[0].first,
                                lastName: results.rows[0].last,
                                userId: id,
                            };

                            console.log(
                                "POST login current id & req.session & userId",
                                id,
                                req.session,
                                user
                            );
                            db.getData(
                                `SELECT * FROM signatures WHERE user_id = ${req.session.userId}`
                            ).then((results) => {
                                if (results !== "") {
                                    req.session.sigId = results.signature;
                                    console.log(
                                        "results.signature",
                                        results.signature
                                    );
                                    res.redirect("/thanks");
                                } else {
                                    res.redirect("/petition");
                                }
                            });
                        } else {
                            res.render("login", { somethingwrong: true });
                        }
                    })
                    .catch((err) =>
                        console.log("error in POST login matchvalue", err)
                    );
            })
            .catch((err) =>
                console.log("error in POST login gethashedPW", err)
            );
    }
});

//=============================
//====     profile   ==========
//=============================

app.get("/profile", (req, res) => {
    res.render("profile");
});

app.post("/profile", (req, res) => {
    const { user } = req.session;
    const url = req.body.url;
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
        res.render("profile", { somethingwrong: true });
    } else {
        db.addProfileInfo(
            req.body.age,
            req.body.city,
            req.body.url,
            user.userId
        )
            .then(() => {
                console.log("profileInfo added!");
                res.redirect("./petition");
            })
            .catch((err) => {
                console.log("err in addProfileInfo", err);
            });
    }
});

//=============================
//====    petition   ==========
//=============================

app.get("/petition", (req, res) => {
    if (req.session.user) {
        const { user } = req.session;
        // db.getData(`SELECT * FROM users WHERE id = ${user.userId}`)
        //     .then((results) => {
        //         let firstName = results.rows[0].first;
        //         let lastName = results.rows[0].last;
        let firstName = user.firstName;
        let lastName = user.lastName;
        res.render("./petition", {
            firstName,
            lastName,
        });
        //     })
        //     .catch((err) => {
        //         console.log("err in petition render", err);
        //     });
    } else {
        res.redirect("/register");
    }
});

app.post("/petition", (req, res) => {
    if (req.body.signature == "") {
        res.render("./petition", { somethingwrong: true });
    } else {
        const { user } = req.session;
        console.log("userId", user);
        db.addSignature(req.body.signature, user.userId)
            .then(() => {
                console.log("POST petition: signature added!");
                req.session.user = { signature: req.body.signature };
                console.log("with req.session.signed", req.session);
                res.redirect("./thanks"); //first finish addsignature then render thanks
            })
            .catch((err) => {
                console.log("err in POST petition addSig", err);
            });
    }
    console.log("names", req.body.first, req.body.last);
});

//==============================
//====    thank you   ==========
//==============================

app.get("/thanks", (req, res) => {
    const { user } = req.session;
    console.log("req.session in thanks", req.session);
    if (!user.signature) {
        res.redirect("/petition");
    } else {
        // db.getData(
        //     `SELECT first, signature FROM users INNER JOIN signatures ON users.id = signatures.user_id`
        // )
        //     .then((results) => {
        //         console.log("GET thanks: INNERjoin results", results);
        //         var indexNum = results.rows.length - 1;
        //         var justSignedName = results.rows[indexNum].first;
        //         var justSignedSignature = results.rows[indexNum].signature;
        //         res.render("thankyou", {
        //             justSignedName,
        //             justSignedSignature,
        //         });
        //     })
        //     .catch((err) => {
        //         console.log("err in getSig", err);
        //     });
        let justSignedName = user.first;
        let justSignedSignature = user.signature;
        res.render("thankyou", {
            justSignedName,
            justSignedSignature,
        });
    }
});

//===================================
//=======   edit profile   ==========
//===================================

app.get("/profile/edit", (req, res) => {
    res.render("profile_edit");
});

app.post("/profile", (req, res) => {
    const { userId } = req.session;
    const url = req.body.url;
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
        res.render("profile", { somethingwrong: true });
    } else {
        db.addProfileInfo(req.body.age, req.body.city, req.body.url, userId)
            .then(() => {
                console.log("profileInfo added!");
                res.redirect("./petition");
            })
            .catch((err) => {
                console.log("err in addProfileInfo", err);
            });
    }
});

//=============================
//====    signers    ==========
//=============================

app.get("/signers", (req, res) => {
    const { user } = req.session;
    if (user.signature) {
        db.getData(
            `SELECT first, last, url, city  FROM users INNER JOIN user_profiles ON users.id = user_profiles.user_id`
        )
            .then((results) => {
                console.log("GET signers: db relults", results.rows);
                var rows = results.rows;
                var signersInfo = [];
                for (var i = 0; i < rows.length; i++) {
                    var fullInfo = {
                        first: rows[i].first,
                        last: rows[i].last,
                        city: rows[i].city,
                        url: rows[i].url,
                    };
                    signersInfo.push(fullInfo);
                }
                res.render("signers", {
                    allSigners: signersInfo,
                });
            })
            .catch((err) => {
                console.log("err in get joined data", err);
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
