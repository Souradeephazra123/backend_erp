const jwt = require('jsonwebtoken');

const SECRET_KEY = process.env.SECRET_KEY;

const publicUrl = ['/api/auth/login','/api/auth/register','/newstudent','/upload_photo','/idcard','/uploads/images/1722069461682-profile.jpg'];
const privateUrl = ['/data'];

const authenticate = (req, res, next) => {
  const url = req.path;
  
  // token not required
  if (publicUrl.includes(url)) {
    next()
    // token required
  } else if (privateUrl.includes(url)) {
    const token = req.headers['authorization'];
    if (token) {
      jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) {
          return res.status(403).send('Invalid token');
        } else {
          req.user = decoded;
          next();
        }
      });
    } else {
      return res.status(403).send('No token provided');
    }
  }
  // invalid url
  else {
    return res.status(500).send('Not found');
  }

};

module.exports = authenticate;

