const isSuperAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'super_admin') {
    return next();
  }
  return res.status(403).json({ error: 'Super Admin access required.' });
};

module.exports = isSuperAdmin;
