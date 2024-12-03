const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const app = express();

// Middleware para parsear el cuerpo de las solicitudes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Conexión a la base de datos
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'tu_contraseña', // Cambia 'tu_contraseña' por tu contraseña real
  database: 'login'
});

// Conexión exitosa
connection.connect((err) => {
  if (err) {
    console.error('Error conectando a la base de datos:', err);
    return;
  }
  console.log('Conectado a la base de datos');
});

app.post('/register', async (req, res) => {
  const { username, password } = req.body;

  // Verificar si el usuario ya existe
  const checkUserQuery = 'SELECT * FROM usuarios WHERE usuario = ?';
  connection.query(checkUserQuery, [username], async (error, results) => {
    if (error) {
      console.error('Error al verificar el usuario:', error);
      return res.status(500).json({ success: false, message: 'Error en el servidor' });
    }

    if (results.length > 0) {
      return res.status(400).json({ success: false, message: 'El nombre de usuario ya existe' });
    }

    try {
      // Hashear la contraseña
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insertar el nuevo usuario
      const insertQuery = 'INSERT INTO usuarios (usuario, password) VALUES (?, ?)';
      connection.query(insertQuery, [username, hashedPassword], (error, result) => {
        if (error) {
          console.error('Error al crear el usuario:', error);
          return res.status(500).json({ success: false, message: 'Error al crear el usuario' });
        }

        res.json({ success: true, message: 'Usuario creado exitosamente' });
      });
    } catch (error) {
      console.error('Error al hashear la contraseña:', error);
      res.status(500).json({ success: false, message: 'Error en el servidor' });
    }
  });
});

// Ruta raíz para verificar que el servidor está funcionando
app.get('/', (req, res) => {
  res.send('¡Servidor funcionando correctamente!');
});

// Ruta para manejar el inicio de sesión
app.post('/login', (req, res) => {
  const { usuario, password } = req.body;

  // Consulta para verificar las credenciales en la base de datos
  connection.query('SELECT * FROM usuarios WHERE usuario = ? AND password = ?', [usuario, password], (error, results) => {
    if (error) {
      console.error('Error en la consulta de la base de datos:', error);
      return res.status(500).send('Error en la consulta de la base de datos');
    }

    if (results.length > 0) {
      res.redirect('http://localhost:5501/aplicacion/ppo.html');
    } else {
      res.redirect('http://localhost:5501/login.html');
    }
  });
});

// formatear la fecha para visualizacion menos chota
function formatDate(dateString) {
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('es-ES', options);
}

// Ruta para agregar proyectos a la base de datos
app.post('/add-project', (req, res) => {
  const { name, description, deadline, team, status } = req.body;

  // Consulta SQL para insertar un nuevo proyecto
  const query = 'INSERT INTO proyectos (nombre, descripcion, fecha_limite, equipo_asignado, estado) VALUES (?, ?, ?, ?, ?)';
  connection.query(query, [name, description, deadline, team, status], (error, results) => {
    if (error) {
      console.error('Error al agregar el proyecto:', error);
      return res.status(500).json({ success: false, message: 'Error al agregar el proyecto' });
    }
    res.json({ success: true, message: 'Proyecto agregado exitosamente' });
  });
});

// Ruta para obtener la lista de proyectos desde la base de datos
app.get('/projects', (req, res) => {
  const query = 'SELECT * FROM proyectos';
  connection.query(query, (error, results) => {
    if (error) {
      console.error('Error al obtener los proyectos:', error);
      return res.status(500).json({ success: false, message: 'Error al obtener los proyectos' });
    }
    
    // Formatear las fechas antes de enviar la respuesta
    const formattedResults = results.map(project => ({
      ...project,
      fecha_limite: formatDate(project.fecha_limite)
    }));
    
    console.log('Proyectos obtenidos:', formattedResults); // Agrega esta línea para depurar
    res.json({ success: true, projects: formattedResults });
  });
});


// Ruta para eliminar un proyecto por ID
app.delete('/delete-project/:id', (req, res) => {
  const projectId = req.params.id;

  // Consulta SQL para eliminar el proyecto
  const query = 'DELETE FROM proyectos WHERE id = ?';
  connection.query(query, [projectId], (error, results) => {
    if (error) {
      console.error('Error al eliminar el proyecto:', error);
      return res.status(500).json({ success: false, message: 'Error al eliminar el proyecto' });
    }
    
    // Depuración: verificar el resultado de la eliminación
    console.log('Resultados de la eliminación:', results);
    
    if (results.affectedRows > 0) {
      res.json({ success: true, message: 'Proyecto eliminado exitosamente' });
    } else {
      res.status(404).json({ success: false, message: 'Proyecto no encontrado' });
    }
  });
});

// Ruta para actualizar un proyecto por ID
app.put('/projects/:id', (req, res) => {
  const projectId = req.params.id; // Obtener el ID del proyecto desde la URL
  const { nombre, descripcion, fecha_limite, equipo_asignado, estado } = req.body;

  // Verifica si se están recibiendo los datos correctamente
  console.log('Datos recibidos para actualizar:', {
    nombre, 
    descripcion, 
    fecha_limite, 
    equipo_asignado, 
    estado, 
    projectId
  });

  // Validar que se hayan enviado todos los campos necesarios
  if (!nombre || !descripcion || !fecha_limite || !equipo_asignado || !estado) {
    return res.status(400).send({ success: false, message: 'Todos los campos son obligatorios' });
  }

  const query = `
    UPDATE proyectos
    SET nombre = ?, descripcion = ?, fecha_limite = ?, equipo_asignado = ?, estado = ?
    WHERE id = ?
  `;

  // Ejecutar la consulta
  connection.query(query, [nombre, descripcion, fecha_limite, equipo_asignado, estado, projectId], (err, result) => {
    if (err) {
      console.error('Error al actualizar el proyecto:', err);
      return res.status(500).send({ success: false, message: 'Error al actualizar el proyecto' });
    }

    // Verificar si algún proyecto fue actualizado
    if (result.affectedRows === 0) {
      return res.status(404).send({ success: false, message: 'No se encontró el proyecto' });
    }

    res.send({ success: true, message: 'Proyecto actualizado correctamente' });
  });
});

app.get('/projects/:id', (req, res) => {
  const projectId = req.params.id;
  const query = 'SELECT * FROM proyectos WHERE id = ?';

  connection.query(query, [projectId], (error, results) => {
    if (error) {
      console.error('Error al obtener el proyecto:', error);
      res.status(500).json({ success: false, message: 'Error interno del servidor' });
    } else if (results.length === 0) {
      res.status(404).json({ success: false, message: 'Proyecto no encontrado' });
    } else {
      const formattedProject = {
        ...results[0],
        fecha_limite: formatDate(results[0].fecha_limite)
      };
      res.json({ success: true, project: formattedProject });
    }
  });
});


// Ruta para obtener todos los equipos
app.get('/teams', (req, res) => {
  const query = 'SELECT * FROM equipos';
  connection.query(query, (error, results) => {
    if (error) {
      console.error('Error al obtener los equipos:', error);
      return res.status(500).json({ success: false, message: 'Error al obtener los equipos' });
    }
    res.json({ success: true, teams: results });
  });
});

// Ruta para agregar un nuevo equipo
app.post('/add-team', (req, res) => {
  const { nombre, integrantes } = req.body;

  const query = 'INSERT INTO equipos (nombre, integrantes) VALUES (?, ?)';
  connection.query(query, [nombre, integrantes], (error, results) => {
    if (error) {
      console.error('Error al agregar el equipo:', error);
      return res.status(500).json({ success: false, message: 'Error al agregar el equipo' });
    }
    res.json({ success: true, message: 'Equipo agregado exitosamente' });
  });
});

// Ruta para eliminar un equipo
app.delete('/delete-team/:id', (req, res) => {
  const teamId = req.params.id;

  const query = 'DELETE FROM equipos WHERE id = ?';
  connection.query(query, [teamId], (error, results) => {
    if (error) {
      console.error('Error al eliminar el equipo:', error);
      return res.status(500).json({ success: false, message: 'Error al eliminar el equipo' });
    }
    
    if (results.affectedRows > 0) {
      res.json({ success: true, message: 'Equipo eliminado exitosamente' });
    } else {
      res.status(404).json({ success: false, message: 'Equipo no encontrado' });
    }
  });
});

// Ruta para actualizar un equipo
app.put('/teams/:id', (req, res) => {
  const teamId = req.params.id;
  const { nombre, integrantes } = req.body;

  const query = 'UPDATE equipos SET nombre = ?, integrantes = ? WHERE id = ?';
  connection.query(query, [nombre, integrantes, teamId], (error, results) => {
    if (error) {
      console.error('Error al actualizar el equipo:', error);
      return res.status(500).json({ success: false, message: 'Error al actualizar el equipo' });
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Equipo no encontrado' });
    }

    res.json({ success: true, message: 'Equipo actualizado exitosamente' });
  });
});

// Ruta para obtener un equipo específico
app.get('/teams/:id', (req, res) => {
  const teamId = req.params.id;
  const query = 'SELECT * FROM equipos WHERE id = ?';
  
  connection.query(query, [teamId], (error, results) => {
    if (error) {
      console.error('Error al obtener el equipo:', error);
      return res.status(500).json({ success: false, message: 'Error al obtener el equipo' });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ success: false, message: 'Equipo no encontrado' });
    }
    
    res.json({ success: true, team: results[0] });
  });
});

// Configura el puerto en el que tu servidor escuchará
const PORT = 5500;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
