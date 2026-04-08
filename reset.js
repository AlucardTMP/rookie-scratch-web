const bcrypt = require('bcryptjs');
const fs = require('fs');

const dbPath = './db.json';
const plainPassword = 'admin'; // <--- LA CONTRASEÑA SERÁ "admin" (así, en minúsculas)

const hash = bcrypt.hashSync(plainPassword, 10);

const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
db.users = [{
    id: "admin-master",
    username: "admin",
    email: "admin@tienda.com",
    password: hash,
    role: "admin"
}];

fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
console.log('✅ Base de datos reseteada.');
console.log('📧 Email: admin@tienda.com');
console.log('🔑 Password: admin');