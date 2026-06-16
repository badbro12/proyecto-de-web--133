document.getElementById("formLogin").addEventListener("submit", async function(e) {
    e.preventDefault();

    const usuario = document.getElementById("usuario").value;
    const password = document.getElementById("password").value;
    console.log(usuario);
    console.log(password);

    const respuesta = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            email: usuario,
            password: password
        })
    });

    if (respuesta.ok) {
        const data = await respuesta.json();

        // Guardar token JWT y datos del usuario
        localStorage.setItem("token", data.token);
        localStorage.setItem("usuario", JSON.stringify(data.usuario));

        // Redirigir al dashboard
        window.location.href = "index.html";

    } else {
        document.getElementById("mensaje").innerText = "Usuario o contraseña incorrectos";
    }
});