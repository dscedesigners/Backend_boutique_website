const checkRole = (roles = []) => {
  return (req, res, next) => {
    // Check if req.user exists (set by verifyToken middleware)
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Check if the user's role is included in the allowed roles
    if (roles.length > 0 && !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Unauthorized: Insufficient role permissions' });
    }
    
    next();
  };
};

export default checkRole;