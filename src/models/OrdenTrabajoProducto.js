const { DataTypes } = require('sequelize');
const sequelize = require('../database');
const OrdenTrabajo = require('./OrdenTrabajo');
const Producto = require('./Producto');

const OrdenTrabajoProducto = sequelize.define('OrdenTrabajoProducto', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  orden_trabajo_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: OrdenTrabajo,
      key: 'id'
    }
  },
  producto_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Producto,
      key: 'id'
    }
  },
  cantidad: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  tableName: 'orden_trabajo_productos',
  timestamps: false
});

// Relaciones (opcional para facilitar consultas con include)
OrdenTrabajoProducto.belongsTo(OrdenTrabajo, { foreignKey: 'orden_trabajo_id' });
OrdenTrabajoProducto.belongsTo(Producto, { foreignKey: 'producto_id' });

module.exports = OrdenTrabajoProducto;
