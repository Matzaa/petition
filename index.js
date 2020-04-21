const express = require("express");
const app = express();
const db = require("./db");
const hb = require("express-handlebars");
const cookieSession = require("cookie-session");
const csurf = require("csurf");
const { hash, compare } = require("./bc");
// exports.app = app;
// const {
//     requireLoggedOutUser,
//     requireNoSignature,
//     requireSignature,
// } = require("./middleware");
// const profileRouter = require("./routes/profile");

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

app.use((req, res, next) => {
    console.log("Im running on every request");
    if (!req.session.user && req.url != "/register" && req.url != "/login") {
        res.redirect("/register");
    } else {
        next();
    }
});

//--------------------routes-------------------------------
app.get("/", (req, res) => {
    res.redirect("./register");
});

// require("./routes/auth");
//=======================================================================================
//==============================    register   ==========================================
//=======================================================================================
app.get("/register", (req, res) => {
    console.log("req.session", req.session);
    if (req.session.user) {
        res.redirect("/profile/edit");
    } else {
        res.render("register");
    }
});

app.post("/register", (req, res) => {
    console.log("cookie in post register", req.session);
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
                req.session.user = {
                    firstName: req.body.first,
                    lastName: req.body.last,
                    email: req.body.email,
                    userId: response.rows[0].id,
                };
                console.log(
                    "POST register - with req.session.user info",
                    req.session
                );
                res.redirect("/profile");
            })

            .catch((err) => {
                console.log("error in POST register hash", err);
                res.render("register", { somethingwrong: true });
            });
    }
});

//==========================================================================================
//==================================    login    ===========================================
//==========================================================================================

app.get("/login", (req, res) => {
    res.render("login");
});

app.post("/login", (req, res) => {
    console.log("cookie in post login", req.session);
    if (!req.body.email || !req.body.password) {
        res.render("login", { somethingwrong: true });
        return;
    } else {
        db.getUsersByEmail(req.body.email)
            .then((results) => {
                const hashedPw = results.rows[0].password;
                compare(req.body.password, hashedPw)
                    .then((matchValue) => {
                        if (matchValue) {
                            req.session.user = {
                                firstName: results.rows[0].first,
                                lastName: results.rows[0].last,
                                email: results.rows[0].email,
                                userId: results.rows[0].id,
                            };

                            console.log(
                                "POST login current id & req.session & userId",

                                req.session
                            );
                            db.checkSig(req.session.user.userId).then(
                                (results) => {
                                    console.log(
                                        "signatures where Id matches",
                                        results
                                    );
                                    if (results.rows[0] !== undefined) {
                                        req.session.user.signature =
                                            results.rows[0].signature;

                                        console.log(
                                            "results.rows[0].signature",
                                            results.rows[0].signature
                                        );

                                        console.log(
                                            "req.session before redirecting to thanks",
                                            req.session
                                        );
                                        res.redirect("/thanks");
                                    } else {
                                        res.redirect("/petition");
                                    }
                                }
                            );
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

//==========================================================================================
//=================================     profile   ==========================================
//==========================================================================================

app.get("/profile", (req, res) => {
    res.render("profile");
});

app.post("/profile", (req, res) => {
    const { user } = req.session;
    const url = req.body.url;
    console.log("cookie in post profile", req.session);
    if (
        !url.startsWith("http://") &&
        !url.startsWith("https://") &&
        url !== ""
    ) {
        res.render("profile", { somethingwrong: true });
    } else {
        if (req.body.age == "") {
            req.body.age = null;
        }
        if (req.body.city == "") {
            req.body.city = null;
        }
        if (req.body.url == "") {
            req.body.url = null;
        }
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

//=========================================================================================
//===================================    petition   =======================================
//=========================================================================================

app.get("/petition", (req, res) => {
    console.log("cookie in get petition", req.session);
    if (req.session.user) {
        const { user } = req.session;
        let firstName = user.firstName;
        let lastName = user.lastName;
        let signature = user.signature;
        res.render("./petition", {
            firstName,
            lastName,
            signature,
        });
    } else {
        res.redirect("/register");
    }
});

app.post("/petition", (req, res) => {
    console.log("cookie in post petition", req.session);
    if (req.body.signature == "") {
        res.render("./petition", { somethingwrong: true });
    } else {
        const { user } = req.session;
        console.log("req.session.user", req.session.user);
        db.addSignature(req.body.signature, user.userId)
            .then(() => {
                console.log("POST petition: signature added!");
                req.session.user.signature = req.body.signature;
                console.log("with req.session.signed", req.session);
                res.redirect("./thanks");
            })
            .catch((err) => {
                console.log("err in POST petition addSig", err);
            });
    }
    console.log("names", req.body.first, req.body.last);
});

//================================================================================
//=====================================   edit profile   =========================
//================================================================================

app.get("/profile/edit", (req, res) => {
    const { user } = req.session;
    db.getFromUsersAndProfiles(user.userId)
        .then((results) => {
            res.render("profile_edit", results.rows[0]);
        })
        .catch((err) => {
            console.log("err in edit profile query results", err);
        });
});

app.post("/profile/edit", (req, res) => {
    console.log("cookie in post profile edit", req.session);
    const { user } = req.session;
    if (req.body.age == "") {
        req.body.age = null;
    }
    if (req.body.city == "") {
        req.body.city = null;
    }

    if (
        !req.body.url.startsWith("http://") &&
        !req.body.url.startsWith("https://") &&
        req.body.url !== ""
    ) {
        db.getFromUsersAndProfiles(user.userId)
            .then((results) => {
                res.render("profile_edit", {
                    first: results.rows[0].first,
                    last: results.rows[0].last,
                    email: results.rows[0].email,
                    age: results.rows[0].age,
                    city: results.rows[0].city,
                    url: results.rows[0].url,
                    somethingwrong: true,
                });
            })
            .catch((err) => {
                console.log("err in edit profile query results", err);
            });
    } else {
        if (req.body.url == "") {
            req.body.url = null;
        }
        if (req.body.password == "") {
            Promise.all([
                db.updateUsersNoPw(
                    req.body.first,
                    req.body.last,
                    req.body.email,
                    user.userId
                ),
                db.upsertProfile(
                    req.body.age,
                    req.body.city,
                    req.body.url,
                    user.userId
                ),
            ])
                .then(() => {
                    db.getFromUsersAndProfiles(user.userId)
                        .then((results) => {
                            user.firstName = req.body.first;
                            user.lastName = req.body.last;
                            user.email = req.body.email;
                            console.log(
                                "updated prfile, this is the cookie",
                                user
                            );
                            res.render("profile_edit", {
                                first: results.rows[0].first,
                                last: results.rows[0].last,
                                email: results.rows[0].email,
                                age: results.rows[0].age,
                                city: results.rows[0].city,
                                url: results.rows[0].url,
                                submitted: true,
                            });
                        })
                        .catch((err) => {
                            console.log(
                                "err in edit profile query results",
                                err
                            );
                        });
                })
                .catch((err) => {
                    console.log("error in profile edit no Pw", err);
                });
        } else {
            hash(req.body.password)
                .then((hashedPw) => {
                    Promise.all([
                        db.updateUsersWithPw(
                            req.body.first,
                            req.body.last,
                            req.body.email,
                            hashedPw,
                            user.userId
                        ),
                        db.upsertProfile(
                            req.body.age,
                            req.body.city,
                            req.body.url,
                            user.userId
                        ),
                    ])
                        .then(() => {
                            db.getFromUsersAndProfiles(user.userId)
                                .then((results) => {
                                    user.firstName = req.body.first;
                                    user.lastName = req.body.last;
                                    user.email = req.body.email;
                                    console.log(
                                        "updated prfile, this is the cookie",
                                        user
                                    );
                                    res.render("profile_edit", {
                                        first: results.rows[0].first,
                                        last: results.rows[0].last,
                                        email: results.rows[0].email,
                                        age: results.rows[0].age,
                                        city: results.rows[0].city,
                                        url: results.rows[0].url,
                                        submitted: true,
                                    });
                                })
                                .catch((err) => {
                                    console.log(
                                        "err in edit profile query results",
                                        err
                                    );
                                });
                        })
                        .catch((err) => {
                            console.log(
                                "error in editprofile getdata with hashedPw",
                                err
                            );
                        });
                })
                .catch((err) => {
                    console.log("err in editprofile hashing Pw", err);
                });
        }
    }
});

//==========================================================================================
//==================================    thank you   ========================================
//==========================================================================================

app.get("/thanks", (req, res) => {
    const { user } = req.session;
    console.log("req.session in thanks", req.session);
    if (!user.signature) {
        res.redirect("/petition");
    } else {
        let justSignedName = user.firstName;
        let justSignedSignature = user.signature;
        res.render("thankyou", {
            justSignedName,
            justSignedSignature,
        });
    }
});

//=========================================================================================
//==================================    signers    ========================================
//=========================================================================================

app.get("/signers", (req, res) => {
    console.log("cookie in get signers ", req.session);
    const { user } = req.session;
    if (user.signature) {
        db.getSigners()
            .then((results) => {
                console.log("signers GET signers: db relults", results.rows);
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

app.post("/signers", (req, res) => {
    console.log("cookie in post signers ", req.session);

    const { user } = req.session;
    db.deleteSig(user.userId)
        .then(() => {
            delete user.signature;
            res.redirect("/petition");
        })
        .catch((err) => {
            console.log("err in delete sig", err);
        });
});

//==================================================================================================
//=====================================    signers by city  ========================================
//==================================================================================================

app.get("/signers/:byCity", (req, res) => {
    const byCity = req.params.byCity;
    console.log("req.params", req.params);
    db.getSignersByCity(byCity).then((results) => {
        console.log("results in signers by city", results.rows[0]);
        var rows = results.rows;
        var signersInfo = [];
        for (var i = 0; i < rows.length; i++) {
            var fullInfo = {
                first: rows[i].first,
                last: rows[i].last,
                url: rows[i].url,
            };
            signersInfo.push(fullInfo);
        }
        res.render("signers_byCity", {
            allSigners: signersInfo,
        });
    });
});

//======================================================================================================
//==================================    logout    =======================================================
//======================================================================================================

app.get("/logout", (req, res) => {
    req.session = null;
    res.redirect("/login");
});

app.listen(process.env.PORT || 8080, () =>
    console.log("petition server listening")
);
