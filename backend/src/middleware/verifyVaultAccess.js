const verifyVaultAccess = (req, res, next) => {
  const isUnlocked = (req.cookies && req.cookies.vaultUnlocked === 'true') || req.headers['x-vault-unlocked'] === 'true';
  if (isUnlocked) {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: 'Vault access locked. Please re-enter your password.',
    code: 'VAULT_LOCKED'
  });
};

module.exports = {
  verifyVaultAccess
};
