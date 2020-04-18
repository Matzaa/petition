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

module.exports.updateNoPw = () => {
    return db.query(`INSERT INTO users (first, last)`);
};

module.exports.updateWithPw = () => {
    return db.query();
};

module.exports.upsertProfile = (age, city, url, user_id) => {
    return db.query(
        `INSERT INTO user_profiles (age, city, url)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (user_id) 
        DO UPDATE SET age = $1, city = $2, url = $3`,
        [age, city, url, user_id]
    );
};
