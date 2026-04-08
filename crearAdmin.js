const bcrypt = require('bcryptjs');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');

async function crearAdmin() {
    const dbPath = './db.json';
    
    try {
        // Leemos la base de datos actual
        const data = await fs.readFile(dbPath, 'utf8');
        const db = JSON.parse(data);

        // Encriptamos la contraseña
        const passwordHashed = await bcrypt.hash('Rokiescratch2026', 10);

        const nuevoAdmin = {
            id: uuidv4(),
            username: "rokiescratch",
            email: "admin@rokiescratch.com",
            password: passwordHashed,
            role: "admin"
        };

        // Aseguramos que exista el arreglo de usuarios y metemos al admin
        db.users = []; 
        db.users.push(nuevoAdmin);

        // Guardamos los cambios
        await fs.writeFile(dbPath, JSON.stringify(db, null, 2));
        
        console.log('✅ ¡Administrador creado con éxito en db.json!');
        console.log('📧 Correo: admin@rokiescratch.com');
        console.log('🔑 Contraseña: Rokiescratch2026');
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

crearAdmin();