const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const path = require('path');
const flash = require('express-flash');
const session = require('express-session');

require('dotenv').config();


const app = express();

// MySQL Connection
const db = mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DB,
    port: process.env.MYSQL_PORT,
});

db.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to MySQL');
});

// Middleware
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(session({
    secret: 'secret_key',
    resave: false,
    saveUninitialized: true
}));
app.use(flash());

// Routes
app.get('/', (req, res) => {
    res.redirect('/products');
});

// Display all products
app.get('/products', (req, res) => {
    db.query('SELECT * FROM products', (err, results) => {
        if (err) throw err;
        res.render('products', {
            products: results,
            messages: req.flash()
        });
    });
});

// Show add product form
app.get('/products/add', (req, res) => {
    res.render('add-product', { messages: req.flash() });
});

// Add new product
app.post('/products/add', (req, res) => {
    const { name, price, description } = req.body;

    if (!name || !price || !description) {
        req.flash('error', 'All fields are required!');
        return res.redirect('/products/add');
    }

    const product = { name, price, description };

    db.query('INSERT INTO products SET ?', product, (err) => {
        if (err) throw err;
        req.flash('success', 'Product added successfully!');
        res.redirect('/products');
    });
});

// Show edit product form
app.get('/products/edit/:id', (req, res) => {
    db.query('SELECT * FROM products WHERE id = ?', [req.params.id], (err, results) => {
        if (err) throw err;
        if (results.length === 0) {
            req.flash('error', 'Product not found');
            return res.redirect('/products');
        }
        res.render('edit-product', {
            product: results[0],
            messages: req.flash()
        });
    });
});

// Update product
app.post('/products/edit/:id', (req, res) => {
    const { name, price, description } = req.body;

    if (!name || !price || !description) {
        req.flash('error', 'All fields are required!');
        return res.redirect(`/products/edit/${req.params.id}`);
    }

    db.query(
        'UPDATE products SET name = ?, price = ?, description = ? WHERE id = ?',
        [name, price, description, req.params.id],
        (err) => {
            if (err) throw err;
            req.flash('success', 'Product updated successfully!');
            res.redirect('/products');
        }
    );
});

// Delete product
app.post('/products/delete/:id', (req, res) => {
    db.query('DELETE FROM products WHERE id = ?', [req.params.id], (err) => {
        if (err) throw err;
        req.flash('success', 'Product deleted successfully!');
        res.redirect('/products');
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});