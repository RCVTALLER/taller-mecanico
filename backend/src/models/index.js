// backend/src/models/index.js
import sequelize from '../config/database.js';
import { DataTypes } from 'sequelize';

// Aquí importaremos todos los modelos y haremos las asociaciones si las hay
// Por ahora solo exportamos la instancia de sequelize y DataTypes
export { sequelize, DataTypes };
