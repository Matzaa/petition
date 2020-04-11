const spicedPg = require("spiced-pg");
const db = spicedPg("postgres:postgres:postgres@localhost:5432/petition");

module.exports.getSignatures = () => {
    return db.query(`SELECT * FROM signatures`);
};

module.exports.addSignature = (first, last, signature) => {
    return db.query(
        `
    INSERT INTO actors (first, last, signature)
    VALUES ($1, $2, $3)`,
        [first, last, signature]
    );
};

// module.exports.getActors = () => {
//     return db.query(`SELECT * FROM actors`);
// };

// module.exports.addActor = (name, age, numberOfOscars) => {
//     return db.query(
//         `
//     INSERT INTO actors (name, age, numberOfOscars)
//     VALUES ($1, $2, $3)`,
//         [name, age, numberOfOscars]
//     );
// };
