// src/database.js
const { Sequelize } = require('sequelize');

// Cambia estos valores según tu instalación local
const DB_NAME = 'taller_mecanico';
const DB_USER = 'root'; // o el usuario que uses
const DB_PASS = 'Documento1';     // tu contraseña de MySQL
const DB_HOST = 'localhost';

const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASS, {
  host: DB_HOST,
  dialect: 'mysql',
  logging: false, // Pon true si quieres ver logs de SQL
});

module.exports = sequelize;
