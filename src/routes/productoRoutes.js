// src/routes/productoRoutes.js
const express = require('express');
const Producto = require('../models/Producto');
const { verificarToken } = require('./authMiddleware');

const router = express.Router();

// Crear producto (solo admins y encargado de inventario)
router.post('/', verificarToken, async (req, res) => {
  if (!['administrador', 'inventario'].includes(req.usuario.rol)) {
    return res.status(403).json({ message: 'No autorizado' });
  }
  const { nombre, descripcion, marca, proveedor, stock, unidad_medida, precio_unitario } = req.body;
  try {
    const nuevo = await Producto.create({
      nombre, descripcion, marca, proveedor, stock, unidad_medida, precio_unitario
    });
    res.json({ message: 'Producto creado', producto: nuevo });
  } catch (err) {
    res.status(500).json({ message: 'Error al crear producto', error: err.message });
  }
});

// Listar productos (todos pueden ver)
router.get('/', verificarToken, async (req, res) => {
  try {
    const productos = await Producto.findAll();
    res.json(productos);
  } catch (err) {
    res.status(500).json({ message: 'Error al listar productos', error: err.message });
  }
});

// Editar producto (solo admins y encargado de inventario)
router.put('/:id', verificarToken, async (req, res) => {
  if (!['administrador', 'inventario'].includes(req.usuario.rol)) {
    return res.status(403).json({ message: 'No autorizado' });
  }
  const { id } = req.params;
  const { nombre, descripcion, marca, proveedor, stock, unidad_medida, precio_unitario } = req.body;
  try {
    const producto = await Producto.findByPk(id);
    if (!producto) return res.status(404).json({ message: 'Producto no encontrado' });

    producto.nombre = nombre ?? producto.nombre;
    producto.descripcion = descripcion ?? producto.descripcion;
    producto.marca = marca ?? producto.marca;
    producto.proveedor = proveedor ?? producto.proveedor;
    producto.stock = stock ?? producto.stock;
    producto.unidad_medida = unidad_medida ?? producto.unidad_medida;
    producto.precio_unitario = precio_unitario ?? producto.precio_unitario;

    await producto.save();
    res.json({ message: 'Producto actualizado', producto });
  } catch (err) {
    res.status(500).json({ message: 'Error al actualizar producto', error: err.message });
  }
});

// Eliminar producto (solo admins)
router.delete('/:id', verificarToken, async (req, res) => {
  if (req.usuario.rol !== 'administrador') {
    return res.status(403).json({ message: 'Solo un administrador puede eliminar productos' });
  }
  const { id } = req.params;
  try {
    const producto = await Producto.findByPk(id);
    if (!producto) return res.status(404).json({ message: 'Producto no encontrado' });
    await producto.destroy();
    res.json({ message: 'Producto eliminado' });
  } catch (err) {
    res.status(500).json({ message: 'Error al eliminar producto', error: err.message });
  }
});

module.exports = router;
