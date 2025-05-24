const { DataTypes } = require('sequelize');
const sequelize = require('../database');
const Producto = require('./Producto');
const Usuario = require('./Usuario');
const Sucursal = require('./Sucursal');

const MovimientoInventario = sequelize.define('MovimientoInventario', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  tipo_movimiento: {
    type: DataTypes.ENUM('entrada', 'salida', 'ajuste'),
    allowNull: false
  },
  cantidad: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  motivo: {
    type: DataTypes.STRING,
    allowNull: true
  },
  fecha_hora: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  producto_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'productos',
      key: 'id'
    }
  },
  usuario_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'usuarios',
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
  }
}, {
  tableName: 'movimientos_inventario',
  timestamps: false
});

// Relaciones
MovimientoInventario.belongsTo(Producto, { foreignKey: 'producto_id' });
MovimientoInventario.belongsTo(Usuario, { foreignKey: 'usuario_id' });
MovimientoInventario.belongsTo(Sucursal, { foreignKey: 'sucursal_id' });

module.exports = MovimientoInventario;
