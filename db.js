const spicedPg = require("spiced-pg");
const db = spicedPg(
    process.env.DATABASE_URL ||
        "postgres:postgres:postgres@localhost:5432/petition"
);

//=========== ADD DATA ===========================

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

//============== GET DATA ========================

module.exports.getData = (dataQuery) => {
    return db.query(dataQuery);
};

//============ PROFILE EDIT QUERIES ==============

module.exports.updateUsersNoPw = (first, last, email, id) => {
    return db.query(
        `
    UPDATE users SET first = $1, last = $2, email = $3 
    WHERE id = $4;
    `,
        [first, last, email, id]
    );
};

module.exports.updateUsersWithPw = (first, last, email, password, id) => {
    return db.query(
        `
    UPDATE users SET first = $1, last = $2, email = $3, password = $4 
    WHERE id = $5;`,
        [first, last, email, password, id]
    );
};

module.exports.upsertProfile = (age, city, url, user_id) => {
    return db.query(
        `INSERT INTO user_profiles (age, city, url, user_id)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (user_id) 
        DO UPDATE SET age = $1, city = $2, url = $3;`,
        [age, city, url, user_id]
    );
};

//================= DELETE SIGNATURE ==========================
module.exports.deleteSig = (user_id) => {
    return db.query(`DELETE FROM  signatures WHERE user_id = $1;`, [user_id]);
};
