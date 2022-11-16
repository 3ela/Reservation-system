const jwt = require('jsonwebtoken');


let jwtObj = {
  createJwt: (payload) => {
    return new Promise ((resolve, reject) => {
      jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: process.env.JWT_EXPIRE_TIME || '3d' }, 
        (err, token) => {
          if(err) {
            reject(err);
            let e = new Error(`Jwt create err`, {cause: `probablly some parameter regarding jwt create function`});
            throw e;
          }else {
            resolve(token);
          }
        })
    })
  },
  validateUser: (req, res, next) => {
    let token = null;
    if(req.headers['authorization'] || req.headers['Authorization']) {
      token = req.headers.authorization.split(' ')[1];
    }
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function(err, decoded) {
      if(err) {
        res.status(401).json({
          msg: `Auth error`,
          err
        });
      }else {
        req.validatedUser = decoded;
        next();
      }
    });
  }
};

module.exports = jwtObj;