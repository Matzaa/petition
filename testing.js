const express = require("express");
const app = express();

const csurf = require("csurf");
const cookieSession = require("cookie-session");

module.exports.app = app;

app.use(
    cookieSession({
        secret: `I'm always angry.`,
        maxAge: 1000 * 60 * 60 * 24 * 14,
    })
);

app.use(csurf());
app.use((req, res, next) => {
    res.set("X-Frame-Options", "deny");
    res.locals.csrfToken = req.csrfToken();
    next();
});

app.get("/welcome", (req, res) => {
    res.send("<h1>welcome to my website</h1>");
});

app.post("/welcome", (req, res) => {
    req.session.submitted = true;
    res.redirect("/home");
});

app.get("/home", (req, res) => {
    if (!req.session.submitted) {
        return res.redirect("/welcome");
    }
    res.send("<h1>home</h1>");
});

if (require.main === module) {
    app.listen(8080, () => console.log("listening"));
}
