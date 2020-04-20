function requireSignature(req, res, next) {
    if (!req.session.user.signature) {
        req.redirect("/petition");
    } else {
        next();
    }
}

function requireNoSignature(req, res, next) {
    if (req.session.user.signature) {
        res.redirect("/thanks");
    } else {
        next();
    }
}

function requireLoggedOutUser(req, res, next) {
    if (req.session.user.userId) {
        res.redirect("/petition");
    } else {
        next();
    }
}

exports.requireLoggedOutUser = requireLoggedOutUser;
exports.requireNoSignature = requireNoSignature;
exports.requireSignature = requireSignature;
