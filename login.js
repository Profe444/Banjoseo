document.querySelector("form").addEventListener("submit", async (e) => {
    e.preventDefault();

    const correo = document.querySelector(".input-group input[type='text']").value;
    const password = document.querySelector(".input-group input[type='password']").value;

    const { data, error } = await supabase.auth.signInWithPassword({
        email: correo,
        password: password
    });

    if (error) {
        alert("Credenciales incorrectas");
        return;
    }

    // Redirigir al banco
    window.location.href = "inicio.html";
});
