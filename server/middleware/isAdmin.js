const isAdmin = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'super_admin' || req.user.role === 'sub_admin')) {
    return next();
  }
  return res.status(403).json({ error: 'Admin access required.' });
};

module.exports = isAdmin;
