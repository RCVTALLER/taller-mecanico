const express = require('express');
const { Op } = require('sequelize');
const MovimientoInventario = require('../models/MovimientoInventario');
const Producto = require('../models/Producto');
const Usuario = require('../models/Usuario');
const { verificarToken } = require('./authMiddleware');

const router = express.Router();

// Registrar movimiento (entrada, salida, ajuste)
router.post('/', verificarToken, async (req, res) => {
  const { producto_id, tipo_movimiento, cantidad, motivo } = req.body;
  const usuario_id = req.usuario.id;

  try {
    // Verificar que el producto existe
    const producto = await Producto.findByPk(producto_id);
    if (!producto) return res.status(404).json({ message: 'Producto no encontrado' });

    // Actualizar stock según tipo de movimiento
    let nuevoStock = producto.stock;
    if (tipo_movimiento === 'entrada') nuevoStock += cantidad;
    else if (tipo_movimiento === 'salida') nuevoStock -= cantidad;
    else if (tipo_movimiento === 'ajuste') nuevoStock = cantidad;
    else return res.status(400).json({ message: 'Tipo de movimiento inválido' });

    if (nuevoStock < 0) return res.status(400).json({ message: 'Stock insuficiente' });

    // Registrar movimiento
    const movimiento = await MovimientoInventario.create({
      producto_id,
      usuario_id,
      tipo_movimiento,
      cantidad,
      motivo
    });

    // Actualizar stock del producto
    producto.stock = nuevoStock;
    await producto.save();

    res.json({ message: 'Movimiento registrado', movimiento });
  } catch (err) {
    res.status(500).json({ message: 'Error al registrar movimiento', error: err.message });
  }
});

// Consultar historial de movimientos (con filtros opcionales)
router.get('/', verificarToken, async (req, res) => {
  try {
    const { producto_id, usuario_id, desde, hasta } = req.query;

    const where = {};
    if (producto_id) where.producto_id = producto_id;
    if (usuario_id) where.usuario_id = usuario_id;
    if (desde || hasta) {
      where.fecha_hora = {};
      if (desde) where.fecha_hora[Op.gte] = new Date(desde);
      if (hasta) where.fecha_hora[Op.lte] = new Date(hasta);
    }

    const movimientos = await MovimientoInventario.findAll({
      where,
      include: [
        { model: Producto, attributes: ['nombre', 'marca'] },
        { model: Usuario, attributes: ['nombre', 'correo'] }
      ],
      order: [['fecha_hora', 'DESC']]
    });

    res.json(movimientos);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener movimientos', error: err.message });
  }
});

module.exports = router;
