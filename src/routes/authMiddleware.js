const jwt = require('jsonwebtoken');

function verificarToken(req, res, next) {
  const header = req.headers['authorization'];
  if (!header) return res.status(401).json({ message: 'Token requerido' });
  const token = header.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Token malformado' });
  jwt.verify(token, process.env.JWT_SECRET, (err, usuario) => {
    if (err) return res.status(401).json({ message: 'Token inválido' });
    req.usuario = usuario;
    next();
  });
}

module.exports = { verificarToken };
