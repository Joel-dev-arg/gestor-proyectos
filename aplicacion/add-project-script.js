// Función para cargar los equipos
function loadTeams() {
    fetch('http://localhost:5500/teams')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const selectElement = document.getElementById('project-team');
                selectElement.innerHTML = '<option value="">Seleccione un equipo</option>'; // Opción por defecto
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

// Cargar los equipos cuando se carga la página
document.addEventListener('DOMContentLoaded', loadTeams);

document.getElementById('add-project-form').addEventListener('submit', function(event) {
    event.preventDefault(); // Evitar el envío del formulario por defecto

    // Obtener valores del formulario
    const name = document.querySelector('input[name="name"]').value;
    const description = document.querySelector('input[name="description"]').value;
    const deadline = document.querySelector('input[name="deadline"]').value;
    const team = document.querySelector('select[name="team"]').value;
    const status = document.querySelector('select[name="status"]').value;

    // Crea el objeto nuevo proyecto
    const newProject = {
        name: name,
        description: description,
        deadline: deadline,
        team: team,
        status: status
    };

    // Enviar el nuevo proyecto a la base de datos
    fetch('http://localhost:5500/add-project', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(newProject)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Error en la solicitud: ' + response.statusText);
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            alert('Proyecto agregado exitosamente');
            window.location.href = 'ppo.html'; // Redirige de vuelta a la página principal
        } else {
            alert('Error al agregar el proyecto');
        }
    })
    .catch((error) => {
        console.error('Error:', error);
    });
});

// Volver a la página principal
document.getElementById('back-button').addEventListener('click', () => {
    window.location.href = 'ppo.html'; // Redirige a la página principal
});