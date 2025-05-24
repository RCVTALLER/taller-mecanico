const { DataTypes } = require('sequelize');
const sequelize = require('../database');
const OrdenTrabajo = require('./OrdenTrabajo');

const OrdenTrabajoFoto = sequelize.define('OrdenTrabajoFoto', {
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
  url: {
    type: DataTypes.STRING,
    allowNull: false
  },
  tipo: {
    type: DataTypes.ENUM('recepcion', 'entrega', 'extra'),
    allowNull: false,
    defaultValue: 'recepcion'
  },
  descripcion: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'orden_trabajo_fotos',
  timestamps: true
});

OrdenTrabajoFoto.belongsTo(OrdenTrabajo, { foreignKey: 'orden_trabajo_id' });

module.exports = OrdenTrabajoFoto;
