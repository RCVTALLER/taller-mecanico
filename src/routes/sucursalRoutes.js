const express = require('express');
const Sucursal = require('../models/Sucursal');
const { verificarToken } = require('./authMiddleware');

const router = express.Router();

// Crear sucursal (solo admin)
router.post('/', verificarToken, async (req, res) => {
  if (req.usuario.rol !== 'administrador') {
    return res.status(403).json({ message: 'Solo administradores pueden crear sucursales' });
  }
  const { nombre, direccion, telefono, correo } = req.body;
  try {
    const nueva = await Sucursal.create({ nombre, direccion, telefono, correo });
    res.json({ message: 'Sucursal creada', sucursal: nueva });
  } catch (err) {
    res.status(500).json({ message: 'Error al crear sucursal', error: err.message });
  }
});

// Listar sucursales (todos los usuarios logueados)
router.get('/', verificarToken, async (_req, res) => {
  try {
    const sucursales = await Sucursal.findAll();
    res.json(sucursales);
  } catch (err) {
    res.status(500).json({ message: 'Error al listar sucursales', error: err.message });
  }
});


module.exports = router;
