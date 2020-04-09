const spicedPg = require("spiced-pg");
const db = spicedPg("postgres:postgres:postgres@localhost:5432/geography");

module.exports.getActors = () => {
    return db.query(`SELECT * FROM actors`);
};

module.exports.addActor = (name, age, numberOfOscars) => {
    return db.query(
        `
    INSERT INTO actors (name, age, numberOfOscars)
    VALUES ($1, $2, $3)`,
        [name, age, numberOfOscars]
    );
};
