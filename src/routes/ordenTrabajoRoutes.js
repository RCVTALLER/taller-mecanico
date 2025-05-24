const express = require('express');
const fs = require('fs');
const path = require('path');
const OrdenTrabajo = require('../models/OrdenTrabajo');
const OrdenTrabajoProducto = require('../models/OrdenTrabajoProducto');
const InventarioSucursal = require('../models/InventarioSucursal');
const Producto = require('../models/Producto');
const OrdenTrabajoBitacora = require('../models/OrdenTrabajoBitacora');
const Usuario = require('../models/Usuario');
const OrdenTrabajoFoto = require('../models/OrdenTrabajoFoto');
const OrdenTrabajoFirma = require('../models/OrdenTrabajoFirma');
const { verificarToken } = require('./authMiddleware');

// ========== CONFIGURACIÓN MULTER PARA FOTOS ==========
const multer = require('multer');
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const ordenId = req.params.id;
    const dir = path.join('uploads', 'ordenes', ordenId);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '_' + file.originalname.replace(/\s/g, ''));
  }
});
const upload = multer({ storage });

const router = express.Router();

// ========== CREAR UNA ORDEN DE TRABAJO ==========
router.post('/', verificarToken, async (req, res) => {
  try {
    const {
      cliente_nombre,
      cliente_telefono,
      vehiculo_marca,
      vehiculo_modelo,
      vehiculo_placa,
      descripcion,
      sucursal_id
    } = req.body;

    const usuario_id = req.usuario.id;

    // Validar campos requeridos
    if (!cliente_nombre || !cliente_telefono || !vehiculo_marca || !vehiculo_modelo || !vehiculo_placa || !descripcion || !sucursal_id) {
      return res.status(400).json({ message: 'Faltan datos requeridos' });
    }

    const nuevaOrden = await OrdenTrabajo.create({
      cliente_nombre,
      cliente_telefono,
      vehiculo_marca,
      vehiculo_modelo,
      vehiculo_placa,
      descripcion,
      sucursal_id,
      usuario_id
    });

    res.json({ message: 'Orden creada correctamente', orden: nuevaOrden });
  } catch (err) {
    res.status(500).json({ message: 'Error al crear orden de trabajo', error: err.message });
  }
});

// ========== OBTENER TODAS LAS ÓRDENES ==========
router.get('/', verificarToken, async (req, res) => {
  try {
    const ordenes = await OrdenTrabajo.findAll();
    res.json(ordenes);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener órdenes', error: err.message });
  }
});

// ========== OBTENER UNA ORDEN POR ID ==========
router.get('/:id', verificarToken, async (req, res) => {
  try {
    const orden = await OrdenTrabajo.findByPk(req.params.id);
    if (!orden) return res.status(404).json({ message: 'Orden no encontrada' });
    res.json(orden);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener la orden', error: err.message });
  }
});

// ========== ACTUALIZAR ESTADO ==========
router.put('/:id/estado', verificarToken, async (req, res) => {
  try {
    const { estado } = req.body;
    const orden = await OrdenTrabajo.findByPk(req.params.id);
    if (!orden) return res.status(404).json({ message: 'Orden no encontrada' });
    orden.estado = estado;
    await orden.save();
    res.json({ message: 'Estado actualizado', orden });
  } catch (err) {
    res.status(500).json({ message: 'Error al actualizar estado', error: err.message });
  }
});

// ========== ASIGNAR PRODUCTOS/INSUMOS A UNA ORDEN ==========
router.post('/:id/productos', verificarToken, async (req, res) => {
  try {
    const orden_trabajo_id = req.params.id;
    const productos = req.body.productos; // Array de objetos: [{ producto_id, cantidad }]

    if (!productos || !Array.isArray(productos)) {
      return res.status(400).json({ message: 'Se requiere un array de productos' });
    }

    // Buscar la orden para saber la sucursal
    const orden = await OrdenTrabajo.findByPk(orden_trabajo_id);
    if (!orden) return res.status(404).json({ message: 'Orden no encontrada' });

    const resultados = [];
    for (const item of productos) {
      const { producto_id, cantidad } = item;
      // Buscar inventario del producto en la sucursal de la orden
      const inventario = await InventarioSucursal.findOne({
        where: { producto_id, sucursal_id: orden.sucursal_id }
      });

      if (!inventario || inventario.stock < cantidad) {
        return res.status(400).json({ message: `Stock insuficiente para el producto ID ${producto_id}` });
      }

      // Descontar stock
      inventario.stock -= cantidad;
      await inventario.save();

      // Guardar la relación orden-producto
      await OrdenTrabajoProducto.create({
        orden_trabajo_id,
        producto_id,
        cantidad
      });

      resultados.push({ producto_id, cantidad, nuevo_stock: inventario.stock });
    }

    res.json({ message: 'Productos asignados y stock actualizado', resultados });
  } catch (err) {
    res.status(500).json({ message: 'Error al asignar productos', error: err.message });
  }
});

// ========== CONSULTAR INSUMOS/PRODUCTOS DE UNA ORDEN ==========
router.get('/:id/productos', verificarToken, async (req, res) => {
  try {
    const orden_trabajo_id = req.params.id;

    // Busca todos los productos asociados a la orden, incluyendo datos del producto
    const productosUsados = await OrdenTrabajoProducto.findAll({
      where: { orden_trabajo_id },
      include: [Producto]
    });

    const detalle = productosUsados.map(item => ({
      producto_id: item.producto_id,
      nombre: item.Producto ? item.Producto.nombre : null,
      cantidad: item.cantidad
    }));

    res.json({ productos: detalle });
  } catch (err) {
    res.status(500).json({ message: 'Error al consultar productos de la orden', error: err.message });
  }
});

// ========== AGREGAR REGISTRO A LA BITÁCORA ==========
router.post('/:id/bitacora', verificarToken, async (req, res) => {
  try {
    const orden_trabajo_id = req.params.id;
    const usuario_id = req.usuario.id;
    const { estado, comentario } = req.body;

    // Validación básica
    if (!estado) {
      return res.status(400).json({ message: 'El estado es obligatorio' });
    }

    // Verifica si existe la orden
    const orden = await OrdenTrabajo.findByPk(orden_trabajo_id);
    if (!orden) return res.status(404).json({ message: 'Orden no encontrada' });

    // Registra el cambio en la bitácora
    const registro = await OrdenTrabajoBitacora.create({
      orden_trabajo_id,
      usuario_id,
      estado,
      comentario,
      fecha_hora: new Date()
    });

    // (Opcional) También actualiza el estado de la orden en la tabla principal
    orden.estado = estado;
    await orden.save();

    res.json({ message: 'Bitácora actualizada y estado de orden cambiado', registro });
  } catch (err) {
    res.status(500).json({ message: 'Error al registrar bitácora', error: err.message });
  }
});

// ========== CONSULTAR BITÁCORA DE UNA ORDEN ==========
router.get('/:id/bitacora', verificarToken, async (req, res) => {
  try {
    const orden_trabajo_id = req.params.id;

    // Trae toda la bitácora de esa orden, ordenada por fecha
    const bitacora = await OrdenTrabajoBitacora.findAll({
      where: { orden_trabajo_id },
      include: [{ model: Usuario, attributes: ['id', 'nombre', 'rol'] }],
      order: [['fecha_hora', 'ASC']]
    });

    // Arma la respuesta para que sea clara
    const historial = bitacora.map(entry => ({
      id: entry.id,
      fecha_hora: entry.fecha_hora,
      estado: entry.estado,
      comentario: entry.comentario,
      usuario_id: entry.usuario_id,
      usuario_nombre: entry.Usuario ? entry.Usuario.nombre : null,
      usuario_rol: entry.Usuario ? entry.Usuario.rol : null
    }));

    res.json({ historial });
  } catch (err) {
    res.status(500).json({ message: 'Error al consultar bitácora', error: err.message });
  }
});

// ========== SUBIR FOTO DE RECEPCIÓN/ENTREGA ==========
/**
 * POST /api/ordenes/:id/foto
 * Body: archivo (form-data), tipo ('recepcion', 'entrega', 'extra'), descripcion
 */
router.post('/:id/foto', verificarToken, upload.single('foto'), async (req, res) => {
  try {
    const orden_trabajo_id = req.params.id;
    const { tipo, descripcion } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: 'Se requiere una foto' });
    }
    if (!['recepcion', 'entrega', 'extra'].includes(tipo)) {
      return res.status(400).json({ message: 'Tipo inválido' });
    }

    // Guarda la ruta (url relativa) de la foto
    const nuevaFoto = await OrdenTrabajoFoto.create({
      orden_trabajo_id,
      url: `/uploads/ordenes/${orden_trabajo_id}/${req.file.filename}`,
      tipo,
      descripcion
    });

    res.json({ message: 'Foto subida', foto: nuevaFoto });
  } catch (err) {
    res.status(500).json({ message: 'Error al subir la foto', error: err.message });
  }
});

// ========== CONSULTAR FOTOS DE UNA ORDEN ==========
router.get('/:id/fotos', verificarToken, async (req, res) => {
  try {
    const orden_trabajo_id = req.params.id;
    const fotos = await OrdenTrabajoFoto.findAll({
      where: { orden_trabajo_id }
    });
    res.json({ fotos });
  } catch (err) {
    res.status(500).json({ message: 'Error al consultar fotos', error: err.message });
  }
});

// ========== GUARDAR FIRMA DIGITAL ==========
/**
 * POST /api/ordenes/:id/firma
 * Body: { firma: (base64 o url), consentimiento_promos: true/false }
 */
router.post('/:id/firma', verificarToken, async (req, res) => {
  try {
    const orden_trabajo_id = req.params.id;
    const { firma, consentimiento_promos } = req.body;

    if (!firma) {
      return res.status(400).json({ message: 'Se requiere la firma' });
    }

    // Guarda la firma (como base64 o url)
    const nuevaFirma = await OrdenTrabajoFirma.create({
      orden_trabajo_id,
      firma,
      consentimiento_promos: !!consentimiento_promos
    });

    res.json({ message: 'Firma guardada', firma: nuevaFirma });
  } catch (err) {
    res.status(500).json({ message: 'Error al guardar firma', error: err.message });
  }
});

// ========== CONSULTAR FIRMA DE UNA ORDEN ==========
router.get('/:id/firma', verificarToken, async (req, res) => {
  try {
    const orden_trabajo_id = req.params.id;
    const firma = await OrdenTrabajoFirma.findOne({
      where: { orden_trabajo_id }
    });
    res.json({ firma });
  } catch (err) {
    res.status(500).json({ message: 'Error al consultar firma', error: err.message });
  }
});

module.exports = router;
