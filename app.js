let editando = false;
let idProyectoEditando = null;
document.addEventListener("DOMContentLoaded", function () {

    const token = localStorage.getItem("token");

    if (!token) {
        window.location.href = "login.html";
        return;
    }

    const boton = document.getElementById("btnNuevoProyecto");
    const formulario = document.getElementById("formProyecto");
    const logout = document.getElementById("btnLogout");

    if (boton && formulario) {
        boton.addEventListener("click", function () {

            if (formulario.style.display === "none") {
                formulario.style.display = "block";
                boton.textContent = "Cancelar";
            } else {
                formulario.style.display = "none";
                boton.textContent = "+ Nuevo Proyecto";
            }

        });
    }

    if (logout) {
        logout.addEventListener("click", function () {

            localStorage.removeItem("token");
            window.location.href = "login.html";

        });
    }

    cargarProyectos();

    async function cargarProyectos() {

        const respuesta = await fetch("http://localhost:5000/proyectos", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            }
        });

        if (respuesta.ok) {
            const proyectos = await respuesta.json();

            const tabla = document.getElementById("tablaProyectos");
            tabla.innerHTML = "";

            proyectos.forEach(p => {
                tabla.innerHTML += `
                    <tr>
                        <td>${p.id}</td>
                        <td>${p.nombre}</td>
                        <td>${p.estado}</td>
                        <td>${p.fecha_inicio}</td>
                        <td>${p.responsable}</td>
                        <td>
                            <button class="btn btn-warning btn-sm me-2"onclick="editarProyecto(${p.id}, '${p.nombre}', '${p.estado}', '${p.fecha_inicio}', '${p.responsable}')">Editar</button>
                            <button class="btn btn-danger btn-sm"onclick="eliminarProyecto(${p.id})">Eliminar</button>
                        </td>
                    </tr>
                `;
            });

        } else {
            console.log("Error al cargar proyectos");
        }
    }

    window.editarProyecto = function (id, nombre, estado, fecha, responsable) {

        document.getElementById("nombreProyecto").value = nombre;
        document.getElementById("estadoProyecto").value = estado;
        document.getElementById("fechaInicio").value = fecha;
        document.getElementById("responsableProyecto").value = responsable;

        editando = true;
        idProyectoEditando = id;

        document.getElementById("btnGuardarProyecto").textContent = "Actualizar Proyecto";

        formulario.style.display = "block";
        boton.textContent = "Cancelar";
    };

    const form = document.querySelector("form");

    form.addEventListener("submit", async function (e) {
        e.preventDefault();

        const token = localStorage.getItem("token");

        const data = {
            nombre: document.getElementById("nombreProyecto").value,
            estado: document.getElementById("estadoProyecto").value,
            fecha_inicio: document.getElementById("fechaInicio").value,
            responsable: document.getElementById("responsableProyecto").value
        };

        let url = "http://localhost:5000/proyectos";
        let method = "POST";

        if (editando) {
            url = `http://localhost:5000/proyectos/${idProyectoEditando}`;
            method = "PUT";
        }

        const respuesta = await fetch(url, {
            method: method,
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            },
            body: JSON.stringify(data)
        });

        if (respuesta.ok) {
            alert(editando ? "Proyecto actualizado" : "Proyecto creado");

            form.reset();
            editando = false;
            idProyectoEditando = null;

            document.getElementById("btnGuardarProyecto").textContent = "Guardar Proyecto";

            location.reload();

        } else {
            alert("Error al guardar");
        }
    });

    window.eliminarProyecto = async function (id) {

        const token = localStorage.getItem("token");

        const confirmar = confirm("¿Seguro que deseas eliminar este proyecto?");

        if (!confirmar) return;

        const respuesta = await fetch(`http://localhost:5000/proyectos/${id}`, {
            method: "DELETE",
            headers: {
                "Authorization": "Bearer " + token
            }
        });

        if (respuesta.ok) {
            alert("Proyecto eliminado");
            location.reload();
        } else {
            alert("Error al eliminar");
        }
    };

});