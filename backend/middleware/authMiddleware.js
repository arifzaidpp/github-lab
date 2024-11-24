import jwt from 'jsonwebtoken';

export const auth = (req, res, next) => {
  try {
    
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }
    

    const decoded = jwt.verify(token, "TS3YwEB1SXlslDn7+484zQevc+j7m/4t9SDEvCM25Yw=");
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};