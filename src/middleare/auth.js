import jwt from "jsonwebtoken";

const authenicateToken = (req, res, next) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]
    if (token == null) {
        return res.status(401).json({message: "Token is not being sent or null"})
    }
    
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({message: "Token no longer valid"})
        } else {
            req.user = user;
            next();
        }
    })
}

export { authenicateToken };