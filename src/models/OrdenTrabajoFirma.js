const { DataTypes } = require('sequelize');
const sequelize = require('../database');
const OrdenTrabajo = require('./OrdenTrabajo');

const OrdenTrabajoFirma = sequelize.define('OrdenTrabajoFirma', {
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
  firma: {
    type: DataTypes.TEXT, // Guarda la firma como imagen base64 o URL
    allowNull: false
  },
  consentimiento_promos: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  }
}, {
  tableName: 'orden_trabajo_firmas',
  timestamps: true
});

OrdenTrabajoFirma.belongsTo(OrdenTrabajo, { foreignKey: 'orden_trabajo_id' });

module.exports = OrdenTrabajoFirma;
