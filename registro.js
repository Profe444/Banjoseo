// ===========================================
// ARCHIVO: registro.js
// ===========================================

document.querySelector("form").addEventListener("submit", async (e) => {
    e.preventDefault();

    // 1. Obtener valores del formulario
    const nombre = document.getElementById("nombre").value.trim();
    const nombreusuario = document.getElementById("nombreusuario").value.trim();
    const correo = document.getElementById("correo").value.trim();
    const cedula = document.getElementById("cedula").value.trim();
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmar-password").value;
    const telefono = document.getElementById("numerodetelefono").value.trim();
    const referido = document.getElementById("referido").value.trim();

    // 2. Verificación de contraseñas
    if (password !== confirmPassword) {
        alert("Las contraseñas no coinciden. Por favor, revísalas.");
        return;
    }
    
    // 3. Registro en Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email: correo,
        password: password
    });

    if (authError) {
        // Muestra el mensaje de error de Supabase (ej: "La contraseña debe tener al menos 6 caracteres")
        alert("Error al registrar el usuario: " + authError.message);
        return;
    }
    
    // Si el registro fue exitoso o si el usuario necesita confirmar el email
    const user = authData.user;
    
    if (!user) {
        // Esto ocurre si la configuración de Supabase requiere confirmación de email.
        alert("Registro exitoso. Revisa tu correo electrónico para confirmar tu cuenta y poder iniciar sesión.");
        window.location.href = "login.html";
        return;
    }
    
    const userId = user.id;

    // 4. Guardar perfil en la tabla 'perfiles' (solo si la autenticación fue inmediata)
    const { error: profileError } = await supabase
        .from("perfiles")
        .insert([
            {
                id: userId, // Es crucial que esta 'id' coincida con el id del usuario de Auth
                nombre,
                nombre_usuario: nombreusuario,
                correo,
                cedula,
                telefono,
                referido
            }
        ]);

    if (profileError) {
        // Si falla la inserción en la tabla de perfil, el usuario ya está creado en Auth.
        // Es una buena práctica registrar este error.
        console.error("Error al guardar perfil. Usuario creado en Auth, pero no en 'perfiles':", profileError.message);
        alert("Registro completado (usuario creado), pero hubo un error al guardar los detalles del perfil. Contacta a soporte.");
        return;
    }

    // 5. Redirección final
    alert("¡Registro completado! Ya puedes iniciar sesión.");
    window.location.href = "login.html";
});