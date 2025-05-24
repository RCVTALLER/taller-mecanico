const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');

const router = express.Router();

// LOGIN
router.post('/login', async (req, res) => {
  const { correo, password } = req.body;
  try {
    const usuario = await Usuario.findOne({ where: { correo } });
    if (!usuario) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }
    const isValid = await bcrypt.compare(password, usuario.password);
    if (!isValid) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    // Generar token JWT
    const token = jwt.sign(
      {
        id: usuario.id,
        correo: usuario.correo,
        rol: usuario.rol,
        nombre: usuario.nombre
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({
      message: 'Login exitoso',
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        correo: usuario.correo,
        rol: usuario.rol
      },
      token
    });
  } catch (err) {
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Middleware de autenticación
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

// REGISTRO DE USUARIO (solo admin puede usar)
router.post('/register', verificarToken, async (req, res) => {
  // Verifica si es admin
  if (req.usuario.rol !== 'administrador') {
    return res.status(403).json({ message: 'No autorizado' });
  }
  const { nombre, correo, password, rol } = req.body;

  if (!['empleado', 'inventario'].includes(rol)) {
    return res.status(400).json({ message: 'Rol no permitido' });
  }

  try {
    const existente = await Usuario.findOne({ where: { correo } });
    if (existente) {
      return res.status(409).json({ message: 'El correo ya está registrado' });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const nuevo = await Usuario.create({
      nombre,
      correo,
      password: passwordHash,
      rol
    });
    res.json({
      message: 'Usuario creado exitosamente',
      usuario: {
        id: nuevo.id,
        nombre: nuevo.nombre,
        correo: nuevo.correo,
        rol: nuevo.rol
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Error interno al registrar usuario' });
  }
});

module.exports = router;
