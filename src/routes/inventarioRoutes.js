const express = require('express');
const InventarioSucursal = require('../models/InventarioSucursal');
const MovimientoInventario = require('../models/MovimientoInventario');
const Producto = require('../models/Producto');
const Sucursal = require('../models/Sucursal');
const { verificarToken } = require('./authMiddleware');
const { Parser } = require('json2csv');

const router = express.Router();

// ========== VALIDACIÓN DE ROL ==========
function esAdminOEncargado(usuario) {
  return usuario.rol === 'administrador' || usuario.rol === 'encargado';
}

// ========== ENTRADA DE INVENTARIO ==========
router.post('/entrada', verificarToken, async (req, res) => {
  try {
    const { producto_id, sucursal_id, cantidad, motivo } = req.body;
    const usuario_id = req.usuario.id;

    if (!producto_id || !sucursal_id || !cantidad) {
      return res.status(400).json({ message: 'Faltan datos requeridos' });
    }

    const producto = await Producto.findByPk(producto_id);
    const sucursal = await Sucursal.findByPk(sucursal_id);
    if (!producto) return res.status(404).json({ message: 'Producto no encontrado' });
    if (!sucursal) return res.status(404).json({ message: 'Sucursal no encontrada' });

    let inventario = await InventarioSucursal.findOne({
      where: { producto_id, sucursal_id }
    });
    if (!inventario) {
      inventario = await InventarioSucursal.create({
        producto_id,
        sucursal_id,
        stock: 0
      });
    }

    inventario.stock += cantidad;
    await inventario.save();

    await MovimientoInventario.create({
      producto_id,
      usuario_id,
      sucursal_id,
      tipo_movimiento: 'entrada',
      cantidad,
      motivo: motivo || 'Entrada de inventario',
      fecha_hora: new Date()
    });

    res.json({ message: 'Stock agregado correctamente', inventario });
  } catch (err) {
    res.status(500).json({ message: 'Error al agregar stock', error: err.message });
  }
});

// ========== TRASLADAR ENTRE SUCURSALES ==========
router.post('/trasladar', verificarToken, async (req, res) => {
  try {
    const { producto_id, cantidad, sucursal_origen_id, sucursal_destino_id, motivo } = req.body;
    const usuario_id = req.usuario.id;

    // SOLO admin o encargado
    if (!esAdminOEncargado(req.usuario)) {
      return res.status(403).json({ message: 'No tiene permiso para trasladar inventario' });
    }

    if (sucursal_origen_id === sucursal_destino_id) {
      return res.status(400).json({ message: 'Las sucursales deben ser diferentes' });
    }

    const producto = await Producto.findByPk(producto_id);
    if (!producto) return res.status(404).json({ message: 'Producto no encontrado' });

    const origen = await Sucursal.findByPk(sucursal_origen_id);
    const destino = await Sucursal.findByPk(sucursal_destino_id);
    if (!origen || !destino) return res.status(404).json({ message: 'Sucursal no encontrada' });

    let inventarioOrigen = await InventarioSucursal.findOne({
      where: { producto_id, sucursal_id: sucursal_origen_id }
    });
    if (!inventarioOrigen || inventarioOrigen.stock < cantidad) {
      return res.status(400).json({ message: 'Stock insuficiente en la sucursal origen' });
    }

    inventarioOrigen.stock -= cantidad;
    await inventarioOrigen.save();

    let inventarioDestino = await InventarioSucursal.findOne({
      where: { producto_id, sucursal_id: sucursal_destino_id }
    });
    if (!inventarioDestino) {
      inventarioDestino = await InventarioSucursal.create({
        producto_id,
        sucursal_id: sucursal_destino_id,
        stock: 0
      });
    }
    inventarioDestino.stock += cantidad;
    await inventarioDestino.save();

    await MovimientoInventario.create({
      producto_id,
      usuario_id,
      sucursal_id: sucursal_origen_id,
      tipo_movimiento: 'salida',
      cantidad,
      motivo: `Traslado a sucursal ${destino.nombre}` + (motivo ? ` - ${motivo}` : ''),
      fecha_hora: new Date()
    });

    await MovimientoInventario.create({
      producto_id,
      usuario_id,
      sucursal_id: sucursal_destino_id,
      tipo_movimiento: 'entrada',
      cantidad,
      motivo: `Traslado desde sucursal ${origen.nombre}` + (motivo ? ` - ${motivo}` : ''),
      fecha_hora: new Date()
    });

    res.json({ message: 'Traslado realizado correctamente' });

  } catch (err) {
    res.status(500).json({ message: 'Error al trasladar producto', error: err.message });
  }
});

// ========== SALIDA DE INVENTARIO ==========
router.post('/salida', verificarToken, async (req, res) => {
  try {
    const { producto_id, sucursal_id, cantidad, motivo } = req.body;
    const usuario_id = req.usuario.id;

    if (!producto_id || !sucursal_id || !cantidad) {
      return res.status(400).json({ message: 'Faltan datos requeridos' });
    }

    const producto = await Producto.findByPk(producto_id);
    const sucursal = await Sucursal.findByPk(sucursal_id);
    if (!producto) return res.status(404).json({ message: 'Producto no encontrado' });
    if (!sucursal) return res.status(404).json({ message: 'Sucursal no encontrada' });

    let inventario = await InventarioSucursal.findOne({
      where: { producto_id, sucursal_id }
    });
    if (!inventario || inventario.stock < cantidad) {
      return res.status(400).json({ message: 'Stock insuficiente' });
    }

    inventario.stock -= cantidad;
    await inventario.save();

    await MovimientoInventario.create({
      producto_id,
      usuario_id,
      sucursal_id,
      tipo_movimiento: 'salida',
      cantidad,
      motivo: motivo || 'Salida de inventario',
      fecha_hora: new Date()
    });

    res.json({ message: 'Salida registrada correctamente', inventario });
  } catch (err) {
    res.status(500).json({ message: 'Error al registrar salida', error: err.message });
  }
});

// ========== CONSULTAR INVENTARIO POR SUCURSAL ==========
router.get('/sucursal/:id', verificarToken, async (req, res) => {
  try {
    const sucursal_id = req.params.id;
    const inventario = await InventarioSucursal.findAll({
      where: { sucursal_id },
      include: [Producto]
    });
    res.json(inventario);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener inventario', error: err.message });
  }
});

// ========== CONSULTAR STOCK DE UN PRODUCTO EN TODAS LAS SUCURSALES ==========
router.get('/producto/:id', verificarToken, async (req, res) => {
  try {
    const producto_id = req.params.id;

    // Buscar inventarios de ese producto en todas las sucursales
    const inventarios = await InventarioSucursal.findAll({
      where: { producto_id },
      include: [Sucursal]
    });

    if (!inventarios.length) {
      return res.status(404).json({ message: 'No hay inventario para este producto' });
    }

    // Formato para mostrar nombre de sucursal y stock
    const resultado = inventarios.map(inv => ({
      sucursal_id: inv.sucursal_id,
      sucursal: inv.Sucursal ? inv.Sucursal.nombre : null,
      stock: inv.stock
    }));

    res.json({ producto_id, resultado });
  } catch (err) {
    res.status(500).json({ message: 'Error al consultar inventario por producto', error: err.message });
  }
});

// ========== CONSULTAR PRODUCTOS CON STOCK BAJO O AGOTADO EN UNA SUCURSAL ==========
router.get('/sucursal/:id/minimos', verificarToken, async (req, res) => {
  try {
    const sucursal_id = req.params.id;
    const min = parseInt(req.query.min) || 5; // valor por defecto: 5

    const inventario = await InventarioSucursal.findAll({
      where: { sucursal_id },
      include: [Producto]
    });

    // Filtrar productos con stock menor o igual al mínimo
    const bajos = inventario
      .filter(item => item.stock <= min)
      .map(item => ({
        producto_id: item.producto_id,
        nombre: item.Producto ? item.Producto.nombre : null,
        stock: item.stock
      }));

    res.json({ sucursal_id, min, productos_bajos: bajos });
  } catch (err) {
    res.status(500).json({ message: 'Error al consultar productos con stock bajo', error: err.message });
  }
});

// ========== CONSULTAR HISTORIAL DE MOVIMIENTOS (con filtro por fecha) ==========
router.get('/historial', verificarToken, async (req, res) => {
  try {
    const { producto_id, sucursal_id, tipo_movimiento, limite, fecha_inicio, fecha_fin } = req.query;
    const filtros = {};

    if (producto_id) filtros.producto_id = producto_id;
    if (sucursal_id) filtros.sucursal_id = sucursal_id;
    if (tipo_movimiento) filtros.tipo_movimiento = tipo_movimiento;

    // Filtro por rango de fechas
    if (fecha_inicio || fecha_fin) {
      filtros.fecha_hora = {};
      if (fecha_inicio) filtros.fecha_hora['$gte'] = new Date(fecha_inicio);
      if (fecha_fin) filtros.fecha_hora['$lte'] = new Date(fecha_fin);
    }

    const movimientos = await MovimientoInventario.findAll({
      where: filtros,
      include: [Producto, Sucursal],
      order: [['fecha_hora', 'DESC']],
      limit: limite ? parseInt(limite) : 50
    });

    const historial = movimientos.map(mov => ({
      id: mov.id,
      fecha_hora: mov.fecha_hora,
      producto_id: mov.producto_id,
      producto: mov.Producto ? mov.Producto.nombre : null,
      sucursal_id: mov.sucursal_id,
      sucursal: mov.Sucursal ? mov.Sucursal.nombre : null,
      tipo_movimiento: mov.tipo_movimiento,
      cantidad: mov.cantidad,
      motivo: mov.motivo,
      usuario_id: mov.usuario_id
    }));

    res.json({ historial });
  } catch (err) {
    res.status(500).json({ message: 'Error al consultar historial', error: err.message });
  }
});

// ========== AJUSTE DE INVENTARIO ==========
router.post('/ajuste', verificarToken, async (req, res) => {
  try {
    const { producto_id, sucursal_id, nuevo_stock, motivo } = req.body;
    const usuario_id = req.usuario.id;

    // SOLO admin o encargado
    if (!esAdminOEncargado(req.usuario)) {
      return res.status(403).json({ message: 'No tiene permiso para ajustar inventario' });
    }

    if (!producto_id || !sucursal_id || nuevo_stock === undefined || motivo === undefined) {
      return res.status(400).json({ message: 'Faltan datos requeridos' });
    }

    const inventario = await InventarioSucursal.findOne({
      where: { producto_id, sucursal_id }
    });

    if (!inventario) {
      return res.status(404).json({ message: 'No existe este producto en la sucursal' });
    }

    const diferencia = nuevo_stock - inventario.stock;
    const stock_anterior = inventario.stock;

    inventario.stock = nuevo_stock;
    await inventario.save();

    await MovimientoInventario.create({
      producto_id,
      usuario_id,
      sucursal_id,
      tipo_movimiento: 'ajuste',
      cantidad: diferencia, // positivo o negativo según el ajuste
      motivo: motivo || 'Ajuste de inventario',
      fecha_hora: new Date()
    });

    res.json({
      message: 'Ajuste realizado correctamente',
      producto_id,
      sucursal_id,
      stock_anterior,
      nuevo_stock,
      diferencia
    });
  } catch (err) {
    res.status(500).json({ message: 'Error al realizar ajuste', error: err.message });
  }
});

// ========== EXPORTAR INVENTARIO DE UNA SUCURSAL EN CSV ==========
router.get('/exportar/inventario/:id', verificarToken, async (req, res) => {
  try {
    const sucursal_id = req.params.id;

    // Consulta inventario con productos
    const inventario = await InventarioSucursal.findAll({
      where: { sucursal_id },
      include: [Producto]
    });

    const datos = inventario.map(item => ({
      producto_id: item.producto_id,
      nombre_producto: item.Producto ? item.Producto.nombre : '',
      stock: item.stock
    }));

    const json2csvParser = new Parser();
    const csv = json2csvParser.parse(datos);

    res.header('Content-Type', 'text/csv');
    res.attachment(`inventario_sucursal_${sucursal_id}.csv`);
    return res.send(csv);

  } catch (err) {
    res.status(500).json({ message: 'Error al exportar inventario', error: err.message });
  }
});

module.exports = router;
