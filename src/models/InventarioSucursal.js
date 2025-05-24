const { DataTypes } = require('sequelize');
const sequelize = require('../database');
const Producto = require('./Producto');
const Sucursal = require('./Sucursal');

const InventarioSucursal = sequelize.define('InventarioSucursal', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  producto_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'productos',
      key: 'id'
    }
  },
  sucursal_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'sucursales',
      key: 'id'
    }
  },
  stock: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0
  }
}, {
  tableName: 'inventario_sucursal',
  timestamps: false
});

// Relación
InventarioSucursal.belongsTo(Producto, { foreignKey: 'producto_id' });
InventarioSucursal.belongsTo(Sucursal, { foreignKey: 'sucursal_id' });

module.exports = InventarioSucursal;
