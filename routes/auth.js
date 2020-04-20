const { requireLoggedOutUser } = require("../middleware");

//=======================================================================================
//==============================    register   ==========================================
//=======================================================================================
app.get("/register", (req, res) => {
    console.log("req.session", req.session);
    if (req.session.user) {
        res.redirect("/profile");
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
    let id;
    console.log("req.body.password", req.body.password);
    if (!req.body.email || !req.body.password) {
        res.render("login", { somethingwrong: true });
        return;
    } else {
        db.getData(
            `SELECT * FROM users WHERE users.email = '${req.body.email}'`
        )
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
                            db.getData(
                                `SELECT * FROM signatures WHERE user_id = '${req.session.user.userId}'`
                            ).then((results) => {
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
