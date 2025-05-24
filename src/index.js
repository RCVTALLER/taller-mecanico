const express = require('express');
require('dotenv').config();
const sequelize = require('./database');
const Usuario = require('./models/Usuario');
const bcrypt = require('bcrypt');

const authRoutes = require('./routes/authRoutes');
const productoRoutes = require('./routes/productoRoutes');
const movimientoRoutes = require('./routes/movimientoRoutes');
const sucursalRoutes = require('./routes/sucursalRoutes');
const inventarioRoutes = require('./routes/inventarioRoutes');
const ordenTrabajoRoutes = require('./routes/ordenTrabajoRoutes');
const OrdenTrabajoProducto = require('./models/OrdenTrabajoProducto');
const OrdenTrabajoBitacora = require('./models/OrdenTrabajoBitacora');
const OrdenTrabajoFoto = require('./models/OrdenTrabajoFoto');
const OrdenTrabajoFirma = require('./models/OrdenTrabajoFirma');


const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/productos', productoRoutes);
app.use('/api/movimientos', movimientoRoutes);
app.use('/api/sucursales', sucursalRoutes);
app.use('/api/inventario', inventarioRoutes);
app.use('/api/ordenes', ordenTrabajoRoutes);
app.use('/api/ordenes', ordenTrabajoRoutes);

app.get('/', (req, res) => {
  res.send('¡API del taller funcionando correctamente!');
});

sequelize.authenticate()
  .then(() => console.log('✔️ Conectado a la base de datos MySQL'))
  .then(() => sequelize.sync({ alter: true })) // <--- AQUÍ SE ACTUALIZAN LAS TABLAS
  .then(async () => {
    // Lista de administradores iniciales
    const admins = [
      {
        nombre: 'Administrador Chavarria',
        correo: 'chavarria@taller.com',
        password: 'superchavarria123',
        rol: 'administrador'
      },
      {
        nombre: 'Administrador Valladares',
        correo: 'valladares@taller.com',
        password: 'supervalladares123',
        rol: 'administrador'
      },
      {
        nombre: 'Administrador Rodriguez',
        correo: 'rodriguez@taller.com',
        password: 'superrodriguez123',
        rol: 'administrador'
      }
    ];

    for (const admin of admins) {
      const user = await Usuario.findOne({ where: { correo: admin.correo } });
      if (!user) {
        const passwordHash = await bcrypt.hash(admin.password, 10);
        await Usuario.create({ ...admin, password: passwordHash });
        console.log(`✅ Usuario ${admin.nombre} creado con correo ${admin.correo}`);
      } else {
        console.log(`ℹ️ El usuario ${admin.nombre} ya existía`);
      }
    }
app.use('/uploads', express.static('uploads'));

    app.listen(PORT, () => {
      console.log(`Servidor escuchando en http://localhost:${PORT}`);
    });
  })
  .catch(err => console.error('❌ Error al conectar o sincronizar la base de datos:', err));
