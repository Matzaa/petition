const spicedPg = require("spiced-pg");
const db = spicedPg("postgres:postgres:postgres@localhost:5432/petition");

module.exports.addSignature = (signature, user_id) => {
    return db.query(
        `
    INSERT INTO signatures (signature, user_id)
    VALUES ($1, $2)
    RETURNING ID;
    
    `,
        [signature, user_id]
    );
};

module.exports.addProfileInfo = (age, city, url, user_id) => {
    return db.query(
        `INSERT INTO user_profiles (age, city, url, user_id)
    VALUES ($1, $2, $3, $4);
    `,
        [age, city, url, user_id]
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
