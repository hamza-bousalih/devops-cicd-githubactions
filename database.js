// database.js
const mysql = require('mysql2');
const util = require('util');

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const initDatabase = async (retries = 5) => {
    const config = {
        host: process.env.MYSQL_HOST || 'localhost',
        user: process.env.MYSQL_USER || 'root',
        password: process.env.MYSQL_PASSWORD || '',
        database: process.env.MYSQL_DB || 'product_db',
        // port: process.env.MYSQL_PORT || 21277,
    };

    console.log('Attempting to connect to MySQL...');

    for (let i = 0; i < retries; i++) {
        try {
            // First connection to create database
            const initialConnection = mysql.createConnection({
                host: config.host,
                user: config.user,
                password: config.password
            });

            const query = util.promisify(initialConnection.query).bind(initialConnection);

            // Create database if not exists
            await query(`CREATE DATABASE IF NOT EXISTS ${config.database}`);
            console.log('Database created or already exists');

            // Close initial connection
            initialConnection.end();

            // Create main connection
            const db = mysql.createConnection(config);
            const dbQuery = util.promisify(db.query).bind(db);

            // Create products table
            await dbQuery(`
                CREATE TABLE IF NOT EXISTS products (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    name VARCHAR(100) NOT NULL,
                    price DECIMAL(10, 2) NOT NULL,
                    description TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                )
            `);
            console.log('Products table created or already exists');

            // Check if table is empty and insert sample data
            const [rows] = await dbQuery('SELECT COUNT(*) as count FROM products');
            if (rows.count === 0) {
                await dbQuery(`
                    INSERT INTO products (name, price, description) VALUES 
                    ('Sample Product 1', 19.99, 'This is a sample product description'),
                    ('Sample Product 2', 29.99, 'Another sample product description'),
                    ('Sample Product 3', 39.99, 'Yet another sample product description')
                `);
                console.log('Sample data inserted');
            }

            return db;

        } catch (error) {
            console.error(`Connection attempt ${i + 1} failed:`, error.message);
            if (i === retries - 1) {
                throw new Error('Failed to connect to database after multiple attempts');
            }
            // Wait before next retry
            await wait(5000); // 5 second delay between retries
        }
    }
};

module.exports = initDatabase;