const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');

const app = express();
const port = 3000;
const dbPath = path.join(__dirname, 'db.json');

// Multer setup for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, 'public', 'imagenes', 'uploads'));
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');

// Clave secreta para firmar los "gafetes" de los usuarios (en un proyecto real, esto va en un archivo .env)
const SECRET_KEY = 'rokiescratch_secreto_super_seguro_2026';

// Agregamos cookie-parser a los middlewares
app.use(cookieParser());

// --- MIDDLEWARE DE SEGURIDAD ---
// Esta función revisa si el usuario tiene permiso para entrar a ciertas rutas
const verificarAdmin = (req, res, next) => {
    const token = req.cookies.token_sesion;

    if (!token) {
        return res.status(401).json({ message: 'Acceso denegado. No has iniciado sesión.' });
    }

    try {
        const verificado = jwt.verify(token, SECRET_KEY);
        if (verificado.role !== 'admin') {
            return res.status(403).json({ message: 'Acceso denegado. No eres administrador.' });
        }
        req.user = verificado; // Guardamos los datos del usuario en la petición
        next(); // ¡Tiene permiso, déjalo pasar!
    } catch (error) {
        res.status(400).json({ message: 'Token inválido o expirado.' });
    }
};

app.use(cors());
app.use(express.json());
// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));


// --- Page Serving ---
// Serve HTML pages from the 'views' directory
const servePage = (pageName) => {
    return (req, res) => {
        res.sendFile(path.join(__dirname, 'views', pageName));
    };
};

app.get('/', servePage('index.html'));
app.get('/admin', servePage('admin.html'));
app.get('/cart', servePage('cart.html'));
app.get('/checkout', servePage('checkout.html'));
app.get('/ilustracion', servePage('ilustracion.html'));
app.get('/tatuajes', servePage('tatuajes.html'));
app.get('/tienda', servePage('tienda.html'));
// A generic product page handler
app.get('/producto', servePage('producto.html'));


// Helper function to read the database
const readDb = async () => {
    try {
        const data = await fs.readFile(dbPath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            // If the file doesn't exist, return a default structure
            return { catalog: [], galleries: { tatuajes: [], ilustracion: [] } };
        }
        throw error;
    }
};

// Helper function to write to the database
const writeDb = async (data) => {
    await fs.writeFile(dbPath, JSON.stringify(data, null, 2));
};
// --- RUTAS DE AUTENTICACIÓN ---

// 1. Registro de Usuario
app.post('/api/register', async (req, res) => {
    try {
        const db = await readDb();
        const { username, email, password, role } = req.body;

        // Verificar si el usuario ya existe
        db.users = db.users || [];
        if (db.users.find(u => u.email === email)) {
            return res.status(400).json({ message: 'El correo ya está registrado.' });
        }

        // Encriptar la contraseña (hash)
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Crear el nuevo usuario
        const newUser = {
            id: uuidv4(),
            username,
            email,
            password: hashedPassword,
            role: role || 'cliente' // Si no le mandamos rol, por defecto es cliente normal
        };

        db.users.push(newUser);
        await writeDb(db);

        res.status(201).json({ message: 'Usuario registrado exitosamente.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error en el servidor al registrar.' });
    }
});

// 2. Inicio de Sesión (Login)
app.post('/api/login', async (req, res) => {
    try {
        const db = await readDb();
        const { email, password } = req.body;

        // Buscar al usuario
        db.users = db.users || [];
        const user = db.users.find(u => u.email === email);
        
        if (!user) {
            return res.status(400).json({ message: 'Usuario o contraseña incorrectos.' });
        }

        // Comparar la contraseña escrita con la encriptada en db.json
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Usuario o contraseña incorrectos.' });
        }

        // Crear el "gafete" (JWT) con sus datos básicos
        const tokenPayload = { id: user.id, username: user.username, role: user.role };
        const token = jwt.sign(tokenPayload, SECRET_KEY, { expiresIn: '8h' });

        // Guardar el token en una cookie segura en el navegador
        res.cookie('token_sesion', token, {
            httpOnly: true, // Para que los hackers no puedan robarla con JavaScript
            secure: false,  // Ponlo en 'true' cuando subas la web a un servidor real con HTTPS
            maxAge: 8 * 60 * 60 * 1000 // Dura 8 horas
        });

        res.json({ message: 'Sesión iniciada correctamente', role: user.role });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error en el servidor al iniciar sesión.' });
    }
});

// 3. Cerrar Sesión
app.post('/api/logout', (req, res) => {
    res.clearCookie('token_sesion');
    res.json({ message: 'Sesión cerrada.' });
});

app.get('/api/test', (req, res) => {
    res.json({ message: 'Hello from the backend!' });
});

// File Upload Endpoint for multiple images
app.post('/api/uploads', verificarAdmin, upload.array('images', 10), (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: 'No files uploaded' });
    }
    const filePaths = req.files.map(file => `imagenes/uploads/${file.filename}`);
    res.json({ filePaths });
});


// Product (Catalog) API Endpoints
app.get('/api/products', async (req, res) => {
    const db = await readDb();
    res.json(db.catalog || []);
});

app.get('/api/products/:id', async (req, res) => {
    const db = await readDb();
    const { id } = req.params;
    const product = (db.catalog || []).find(p => p.id === id);

    if (product) {
        res.json(product);
    } else {
        res.status(404).json({ message: 'Product not found' });
    }
});

const slugify = (text) => {
    return text.toString().toLowerCase()
        .replace(/\s+/g, '-')           // Replace spaces with -
        .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
        .replace(/\-\-+/g, '-')         // Replace multiple - with single -
        .replace(/^-+/, '')             // Trim - from start of text
        .replace(/-+$/, '');            // Trim - from end of text
};

app.post('/api/products', verificarAdmin, async (req, res) => {
    try {
        const db = await readDb();
        const { name, price, description, images } = req.body;

        if (!name || !price || !images || !Array.isArray(images) || images.length === 0) {
            return res.status(400).json({ message: 'Missing required product data: name, price, and at least one image are required.' });
        }
        
        const productId = uuidv4();
        const newProduct = {
            id: productId,
            name,
            price,
            description,
            images,
            // Point to the generic product page, the client will use the ID from the URL
            page: `producto.html?id=${productId}`
        };
        
        db.catalog = db.catalog || [];
        db.catalog.push(newProduct);
        await writeDb(db);
        
        res.status(201).json(newProduct);
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({ message: 'Error creating product.' });
    }
});

app.put('/api/products/:id', async (req, res) => {
    const db = await readDb();
    const { id } = req.params;
    const updatedProduct = req.body;
    db.catalog = db.catalog || [];
    const index = db.catalog.findIndex(p => p.id === id);

    if (index !== -1) {
        db.catalog[index] = { ...db.catalog[index], ...updatedProduct };
        await writeDb(db);
        res.json(db.catalog[index]);
    } else {
        res.status(404).json({ message: 'Product not found' });
    }
});

app.delete('/api/galleries/:category/:id', verificarAdmin, async (req, res) => {
    const db = await readDb();
    const { id } = req.params;
    db.catalog = db.catalog || [];
    const initialLength = db.catalog.length;
    db.catalog = db.catalog.filter(p => p.id !== id);

    if (db.catalog.length < initialLength) {
        await writeDb(db);
        res.status(204).send();
    } else {
        res.status(404).json({ message: 'Product not found' });
    }
});

// Gallery API Endpoints
app.get('/api/galleries/:category', async (req, res) => {
    const db = await readDb();
    const { category } = req.params;
    res.json(db.galleries[category] || []);
});

app.post('/api/galleries/:category', async (req, res) => {
    const db = await readDb();
    const { category } = req.params;
    const newImage = { id: uuidv4(), ...req.body };
    db.galleries = db.galleries || { tatuajes: [], ilustracion: [] };
    db.galleries[category] = db.galleries[category] || [];
    db.galleries[category].push(newImage);
    await writeDb(db);
    res.status(201).json(newImage);
});

app.put('/api/galleries/:category/:id', async (req, res) => {
    const db = await readDb();
    const { category, id } = req.params;
    const updatedImage = req.body;
    db.galleries = db.galleries || { tatuajes: [], ilustracion: [] };
    db.galleries[category] = db.galleries[category] || [];
    const index = db.galleries[category].findIndex(i => i.id === id);

    if (index !== -1) {
        db.galleries[category][index] = { ...db.galleries[category][index], ...updatedImage };
        await writeDb(db);
        res.json(db.galleries[category][index]);
    } else {
        res.status(404).json({ message: 'Image not found' });
    }
});

app.post('/api/galleries/:category/reorder', async (req, res) => {
    const db = await readDb();
    const { category } = req.params;
    const { orderedIds } = req.body;
    db.galleries = db.galleries || { tatuajes: [], ilustracion: [] };
    db.galleries[category] = db.galleries[category] || [];
    
    const orderedImages = orderedIds.map(id => db.galleries[category].find(img => img.id === id)).filter(Boolean);
    db.galleries[category] = orderedImages;

    await writeDb(db);
    res.json(db.galleries[category]);
});

app.delete('/api/galleries/:category/:id', async (req, res) => {
    const db = await readDb();
    const { category, id } = req.params;
    db.galleries = db.galleries || { tatuajes: [], ilustracion: [] };
    db.galleries[category] = db.galleries[category] || [];
    const initialLength = db.galleries[category].length;
    db.galleries[category] = db.galleries[category].filter(i => i.id !== id);

    if (db.galleries[category].length < initialLength) {
        await writeDb(db);
        res.status(204).send();
    } else {
        res.status(404).json({ message: 'Image not found' });
    }
});


app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
