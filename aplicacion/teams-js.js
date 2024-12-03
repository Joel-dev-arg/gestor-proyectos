// Cargar equipos al iniciar la página
function loadTeams() {
    fetch('http://localhost:5500/teams')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                displayTeams(data.teams);
            } else {
                alert('Error al cargar equipos');
            }
        })
        .catch(error => console.error('Error:', error));
}

// Mostrar equipos en la interfaz
function displayTeams(teams) {
    const container = document.getElementById('teams-container');
    container.innerHTML = '';

    teams.forEach(team => {
        const teamDiv = document.createElement('div');
        teamDiv.className = 'team-item';
        teamDiv.innerHTML = `
            <h3>${team.nombre}</h3>
            <p><strong>Integrantes:</strong></p>
            <p>${team.integrantes}</p>
            <div class="team-actions">
                <button onclick="openEditModal(${team.id})" class="edit-button">Editar</button>
                <button onclick="deleteTeam(${team.id})" class="delete-button">Eliminar</button>
            </div>
        `;
        container.appendChild(teamDiv);
    });
}

// Función para normalizar el nombre del equipo (elimina espacios y caracteres especiales)
function normalizeName(name) {
    return name.toLowerCase().replace(/\s+/g, '').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}


// Actualizar equipo con validación de nombre
// Agregar nuevo equipo con validación de nombre (normalizado)
document.getElementById('add-team-form').addEventListener('submit', function(event) {
    event.preventDefault();

    const teamName = document.getElementById('team-name').value;
    const normalizedTeamName = normalizeName(teamName); // Normalizar nombre
    const formData = {
        nombre: teamName,
        integrantes: document.getElementById('team-members').value
    };

    // Comprobar si el nombre ya existe (usando la versión normalizada)
    fetch('http://localhost:5500/teams')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const normalizedTeamNames = data.teams.map(team => normalizeName(team.nombre)); // Normalizar nombres existentes
                if (normalizedTeamNames.includes(normalizedTeamName)) {
                    alert('El nombre del equipo ya existe. Elige otro nombre.');
                } else {
                    // Si el nombre no existe, agregar el nuevo equipo
                    fetch('http://localhost:5500/add-team', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(formData)
                    })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            alert('Equipo agregado exitosamente');
                            loadTeams();
                            document.getElementById('add-team-form').reset();
                        } else {
                            alert('Error al agregar el equipo');
                        }
                    })
                    .catch(error => console.error('Error:', error));
                }
            } else {
                alert('Error al cargar equipos');
            }
        })
        .catch(error => console.error('Error:', error));
});


// Eliminar equipo
function deleteTeam(teamId) {
    if (confirm('¿Estás seguro de que quieres eliminar este equipo?')) {
        fetch(`http://localhost:5500/delete-team/${teamId}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Equipo eliminado exitosamente');
                loadTeams();
            } else {
                alert('Error al eliminar el equipo');
            }
        })
        .catch(error => console.error('Error:', error));
    }
}

// Modal de edición
const modal = document.getElementById('edit-modal');
const span = document.getElementsByClassName('close')[0];

span.onclick = function() {
    modal.style.display = 'none';
}

window.onclick = function(event) {
    if (event.target == modal) {
        modal.style.display = 'none';
    }
}

// Abrir modal de edición
function openEditModal(teamId) {
    fetch(`http://localhost:5500/teams/${teamId}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const team = data.team;
                document.getElementById('edit-team-id').value = team.id;
                document.getElementById('edit-team-name').value = team.nombre;
                document.getElementById('edit-team-members').value = team.integrantes;
                modal.style.display = 'block';
            }
        })
        .catch(error => console.error('Error:', error));
}

// Actualizar equipo
document.getElementById('edit-team-form').addEventListener('submit', function(event) {
    event.preventDefault();
    
    const teamId = document.getElementById('edit-team-id').value;
    const formData = {
        nombre: document.getElementById('edit-team-name').value,
        integrantes: document.getElementById('edit-team-members').value
    };

    fetch(`http://localhost:5500/teams/${teamId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Equipo actualizado exitosamente');
            modal.style.display = 'none';
            loadTeams();
        } else {
            alert('Error al actualizar el equipo');
        }
    })
    .catch(error => console.error('Error:', error));
});

// Cargar equipos al iniciar la página
document.addEventListener('DOMContentLoaded', loadTeams);
