const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const OrdenTrabajo = sequelize.define('OrdenTrabajo', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  cliente_nombre: {
    type: DataTypes.STRING,
    allowNull: false
  },
  cliente_telefono: {
    type: DataTypes.STRING,
    allowNull: false
  },
  vehiculo_marca: {
    type: DataTypes.STRING,
    allowNull: false
  },
  vehiculo_modelo: {
    type: DataTypes.STRING,
    allowNull: false
  },
  vehiculo_placa: {
    type: DataTypes.STRING,
    allowNull: false
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  sucursal_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  usuario_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  estado: {
    type: DataTypes.ENUM('pendiente', 'en proceso', 'terminado', 'entregado', 'cancelado'),
    defaultValue: 'pendiente'
  }
}, {
  tableName: 'ordenes_trabajo',
  timestamps: true
});

// Puedes asociar después Usuario, Sucursal, etc.

module.exports = OrdenTrabajo;
