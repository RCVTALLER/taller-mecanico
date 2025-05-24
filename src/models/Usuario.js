const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const Usuario = sequelize.define('Usuario', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false
  },
  correo: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  rol: {
    type: DataTypes.ENUM('administrador', 'empleado', 'encargado'),
    allowNull: false,
    defaultValue: 'empleado'
  },
  sucursal_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'sucursales',
      key: 'id'
    }
  }
}, {
  tableName: 'usuarios',
  timestamps: true
});

const Sucursal = require('./Sucursal');
Usuario.belongsTo(Sucursal, { foreignKey: 'sucursal_id' });

module.exports = Usuario;
