const { DataTypes } = require('sequelize');
const sequelize = require('../database');
const OrdenTrabajo = require('./OrdenTrabajo');
const Usuario = require('./Usuario');

const OrdenTrabajoBitacora = sequelize.define('OrdenTrabajoBitacora', {
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
  usuario_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Usuario,
      key: 'id'
    }
  },
  estado: {
    type: DataTypes.STRING,
    allowNull: false
  },
  comentario: {
    type: DataTypes.STRING,
    allowNull: true
  },
  fecha_hora: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'orden_trabajo_bitacoras',
  timestamps: false
});

// Relaciones útiles para consultas
OrdenTrabajoBitacora.belongsTo(OrdenTrabajo, { foreignKey: 'orden_trabajo_id' });
OrdenTrabajoBitacora.belongsTo(Usuario, { foreignKey: 'usuario_id' });

module.exports = OrdenTrabajoBitacora;
