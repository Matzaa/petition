const express = require("express");
const router = express.Router();
module.exports = router;
//==========================================================================================
//=================================     profile   ==========================================
//==========================================================================================

router.get("/profile", (req, res) => {
    res.render("profile");
});

router.post("/profile", (req, res) => {
    const { user } = req.session;
    const url = req.body.url;
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

//================================================================================
//=====================================   edit profile   =========================
//================================================================================

router.get("/profile/edit", (req, res) => {
    const { user } = req.session;
    db.getData(
        `SELECT * FROM users LEFT JOIN user_profiles ON users.id = user_profiles.user_id WHERE users.id = '${user.userId}' `
    )
        .then((results) => {
            res.render("profile_edit", results.rows[0]);
        })
        .catch((err) => {
            console.log("err in edit profile query results", err);
        });
});

router.post("/profile/edit", (req, res) => {
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
        res.render("profile_edit", { somethingwrong: true });
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
                    db.getData(
                        `SELECT * FROM users LEFT JOIN user_profiles ON users.id = user_profiles.user_id WHERE users.id = '${user.userId}' `
                    )
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
                            db.getData(
                                `SELECT * FROM users LEFT JOIN user_profiles ON users.id = user_profiles.user_id WHERE users.id = '${user.userId}' `
                            )
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
