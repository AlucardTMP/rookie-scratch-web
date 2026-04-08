const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const cookieParser = require('cookie-parser');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 3000;

// Configuración de almacenamiento de imágenes
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = './public/imagenes/uploads';
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage });

app.use(express.json());
app.use(cookieParser());
app.use(express.static('public'));

// Función para leer/escribir DB
const getDB = () => JSON.parse(fs.readFileSync('./db.json', 'utf-8'));
const saveDB = (data) => fs.writeFileSync('./db.json', JSON.stringify(data, null, 2));

// Middleware de seguridad
const verificarAdmin = (req, res, next) => {
    const { adminSession } = req.cookies;
    if (adminSession === 'active') return next();
    res.status(401).json({ message: 'No autorizado' });
};

// --- RUTAS DE AUTENTICACIÓN ---
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    const db = getDB();
    const user = db.users.find(u => u.email === email);
    if (user && await bcrypt.compare(password, user.password)) {
        res.cookie('adminSession', 'active', { httpOnly: true });
        return res.json({ message: 'Login OK', role: 'admin' });
    }
    res.status(401).json({ message: 'Usuario o contraseña incorrectos' });
});

app.post('/api/logout', (req, res) => {
    res.clearCookie('adminSession');
    res.json({ message: 'Sesión cerrada' });
});

// --- RUTAS DE PRODUCTOS ---
app.get('/api/products', (req, res) => {
    res.json(getDB().catalog || []);
});

app.post('/api/products', verificarAdmin, (req, res) => {
    const db = getDB();
    const newProduct = { id: uuidv4(), ...req.body };
    db.catalog.push(newProduct);
    saveDB(db);
    res.json(newProduct);
});

app.delete('/api/products/:id', verificarAdmin, (req, res) => {
    const db = getDB();
    const initialLength = db.catalog.length;
    db.catalog = db.catalog.filter(p => p.id !== req.params.id);
    if (db.catalog.length === initialLength) return res.status(404).json({message: "No encontrado"});
    saveDB(db);
    res.json({ message: 'Eliminado' });
});

// --- RUTAS DE GALERÍAS ---
app.get('/api/galleries/:category', (req, res) => {
    const db = getDB();
    res.json(db.galleries[req.params.category] || []);
});

app.post('/api/galleries/:category', verificarAdmin, (req, res) => {
    const db = getDB();
    const newItem = { id: uuidv4(), ...req.body };
    if (!db.galleries[req.params.category]) db.galleries[req.params.category] = [];
    db.galleries[req.params.category].push(newItem);
    saveDB(db);
    res.json(newItem);
});

app.delete('/api/galleries/:category/:id', verificarAdmin, (req, res) => {
    const db = getDB();
    db.galleries[req.params.category] = db.galleries[req.params.category].filter(item => item.id !== req.params.id);
    saveDB(db);
    res.json({ message: 'Eliminado' });
});

app.post('/api/uploads', verificarAdmin, upload.array('images'), (req, res) => {
    const filePaths = req.files.map(f => `/imagenes/uploads/${f.filename}`);
    res.json({ filePaths });
});

// Servir páginas HTML
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'views/admin.html')));
app.get('/tienda', (req, res) => res.sendFile(path.join(__dirname, 'views/tienda.html')));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'views/index.html')));

app.listen(PORT, () => console.log(`Servidor en http://localhost:${PORT}`));