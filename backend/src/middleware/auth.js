const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const bearerToken = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.split(' ')[1]
    : null;
  const token = req.cookies.token || bearerToken || req.query.token;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'No token. Please log in.',
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = {
      id: decoded.id,
      role: decoded.role,
      email: decoded.email,
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Session expired.',
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.',
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Authentication failed.',
    });
  }
};

module.exports = {
  verifyToken,
};
