const spicedPg = require("spiced-pg");
const db = spicedPg("postgres:postgres:postgres@localhost:5432/petition");

module.exports.addSignature = (first, last, signature) => {
    return db.query(
        `
    INSERT INTO signatures (first, last, signature)
    VALUES ($1, $2, $3)
    RETURNING ID;
    
    `,
        [first, last, signature]
    );
};

module.exports.addUser = (first, last, email, password) => {
    return db.query(
        `
    INSERT INTO users (first, last, email, password)
    VALUES ($1, $2, $3, $4)
    RETURNING ID;
    
    `,
        [first, last, email, password]
    );
};

module.exports.getData = (dataQuery) => {
    return db.query(dataQuery);
};

// module.exports.getNames = () => {
//     return db.query(`SELECT first, last FROM signatures`);
// };

// module.exports.getFirstName = () => {
//     return db.query(`SELECT first FROM signatures`);
// };

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
