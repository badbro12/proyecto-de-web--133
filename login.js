document.getElementById("formLogin").addEventListener("submit", async function(e) {
    e.preventDefault();

    const usuario = document.getElementById("usuario").value;
    const password = document.getElementById("password").value;

    const respuesta = await fetch("http://localhost:5000/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            username: usuario,
            password: password
        })
    });

    if (respuesta.ok) {
        const data = await respuesta.json();

        // Guardar token JWT
        localStorage.setItem("token", data.token);

        // Redirigir al dashboard
        window.location.href = "index.html";

    } else {
        document.getElementById("mensaje").innerText = "Usuario o contraseña incorrectos";
    }
});