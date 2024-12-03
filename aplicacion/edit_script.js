// Función para obtener el ID del proyecto desde la URL
function getProjectIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
  }
  
  // Función para formatear la fecha en el formato requerido YYYY-MM-DD
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
}


// Función para parsear la fecha al formato del servidor
function parseDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Función para cargar los equipos
function loadTeams() {
    fetch('http://localhost:5500/teams')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const selectElement = document.getElementById('edit-team');
                selectElement.innerHTML = ''; // Limpiar opciones existentes
                data.teams.forEach(team => {
                    const option = document.createElement('option');
                    option.value = team.id;
                    option.textContent = team.nombre;
                    selectElement.appendChild(option);
                });
            } else {
                console.error('Error al cargar los equipos');
            }
        })
        .catch(error => console.error('Error:', error));
}

// Modificar la función loadProjectData para incluir la carga de equipos
function loadProjectData() {
    const projectId = getProjectIdFromUrl();
    if (projectId) {
        // Cargar datos del proyecto y equipos
        fetch(`http://localhost:5500/teams`)
            .then(res => res.json())
            .then(teamsData => {
                if (teamsData.success) {
                    const selectElement = document.getElementById('edit-team');
                    selectElement.innerHTML = ''; // Limpiar opciones existentes
                    
                    // Agregar opciones de equipos
                    teamsData.teams.forEach(team => {
                        const option = document.createElement('option');
                        option.value = team.id;
                        option.textContent = team.nombre;
                        selectElement.appendChild(option);
                    });

                    // Luego de cargar los equipos, cargar los datos del proyecto
                    return fetch(`http://localhost:5500/projects/${projectId}`);
                } else {
                    throw new Error('Error al cargar los equipos');
                }
            })
            .then(res => res.json())
            .then(projectData => {
                if (projectData.success) {
                    // Rellenar los campos del formulario con los datos del proyecto
                    document.getElementById('edit-project-id').value = projectId;
                    document.getElementById('edit-name').value = projectData.project.nombre;
                    document.getElementById('edit-status').value = projectData.project.estado;
                    document.getElementById('edit-description').value = projectData.project.descripcion;
                    document.getElementById('edit-deadline').value = formatDate(projectData.project.fecha_limite);

                    // Seleccionar el equipo asignado actual
                    const teamSelect = document.getElementById('edit-team');
                    teamSelect.value = projectData.project.equipo_asignado || "";
                } else {
                    alert('Error al cargar los datos del proyecto');
                }
            })
            .catch(error => {
                console.error('Error al cargar los datos:', error);
            });
    } else {
        alert('No se proporcionó un ID de proyecto válido');
    }
}

  
  // Manejar la actualización del proyecto al enviar el formulario
  document.getElementById('edit-project-form').addEventListener('submit', (event) => {
      event.preventDefault();
      const projectId = document.getElementById('edit-project-id').value;
      
      const updatedProject = {
          nombre: document.getElementById('edit-name').value,
          estado: document.getElementById('edit-status').value,
          descripcion: document.getElementById('edit-description').value,
          equipo_asignado: document.getElementById('edit-team').value,
          fecha_limite: document.getElementById('edit-deadline').value
      };
  
      fetch(`http://localhost:5500/projects/${projectId}`, {
          method: 'PUT',
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify(updatedProject)
      })
      .then(response => {
          if (response.ok) {
              alert('Proyecto actualizado exitosamente');
              window.location.href = 'ppo.html';
          } else {
              return response.text().then(text => { 
                  throw new Error(`Error ${response.status}: ${text}`);
              });
          }
      })
      .catch(error => {
          console.error('Error al actualizar el proyecto:', error);
          alert('Error al actualizar el proyecto: ' + error.message);
      });
  });
  
  // Inicializar carga de datos del proyecto al cargar la página
  document.addEventListener('DOMContentLoaded', loadProjectData);
  