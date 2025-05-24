const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const Sucursal = sequelize.define('Sucursal', {
  nombre: {
    type: DataTypes.STRING,
    allowNull: false
  },
  direccion: {
    type: DataTypes.STRING,
    allowNull: false
  },
  telefono: {
    type: DataTypes.STRING,
    allowNull: true
  },
  correo: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'sucursales',
  timestamps: true
});

module.exports = Sucursal;
