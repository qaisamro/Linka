const isUniversity = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized: login required' });
    }

    const { role, entity_type } = req.user;

    // Support old roles for back-compat, and new entity type
    const isUni = role === 'university' || (role === 'entity' && entity_type === 'university');
    const isPlatformAdmin = role === 'admin' || role === 'super_admin';

    if (isUni || isPlatformAdmin) {
        return next();
    }

    return res.status(403).json({ error: 'Forbidden: University access required' });
};

module.exports = isUniversity;
