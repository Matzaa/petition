const supertest = require("supertest");
const { app } = require("./testing");
const cookieSession = require("cookie-session");

test("get/welcome sends 200 st code as res", () => {
    return supertest(app)
        .get("/welcome")
        .then((res) => {
            // console.log("res from server", res);
            expect(res.statusCode).toBe(200);
            expect(res.text).toBe("<h1>welcome to my website</h1>");
        });
});

test("GET/home sends 302 st code as res when no cookie", () => {
    return supertest(app)
        .get("/home")
        .then((res) => {
            expect(res.statusCode).toBe(302);
        });
});

test("GET/home sends 200 st code when theres submitted cookie", () => {
    cookieSession.mockSessionOnce({
        submitted: true,
    });
    return supertest(app)
        .get("/home")
        .then((res) => {
            expect(res.statusCode).toBe(200);
            expect(res.text).toBe("<h1>home</h1>");
        });
});

test("POST welcome sets req.session.submitted to true", () => {
    const cookie = {};
    cookieSession.mockSessionOnce(cookie);
    return supertest(app)
        .post("/welcome")
        .then((res) => {
            console.log("cookie in my test", cookie);
        });
});
