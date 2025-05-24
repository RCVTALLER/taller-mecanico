const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const Producto = sequelize.define('Producto', {
  nombre: {
    type: DataTypes.STRING,
    allowNull: false
  },
  descripcion: {
    type: DataTypes.STRING,
    allowNull: true
  },
  marca: {
    type: DataTypes.STRING,
    allowNull: true
  },
  proveedor: {
    type: DataTypes.STRING,
    allowNull: true
  },
  stock: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0
  },
  unidad_medida: {
    type: DataTypes.STRING,
    allowNull: false
  },
  precio_unitario: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0
  }
}, {
  tableName: 'productos',
  timestamps: true
});

module.exports = Producto;