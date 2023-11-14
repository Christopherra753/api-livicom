import express from "express";
import { pool } from "./db.js"
import cors from "cors"
import bcryptjs from "bcryptjs"
import { PORT } from './config.js'

const app = express()
app.use(express.json())
app.use(cors())

app.post("/verify-email", async (req, res) => {
    const { email } = req.body
    const [data] = await pool.query("SELECT email FROM users WHERE email = ?", [email])
    if (data.length > 0) return res.json({ result: true })
    return res.json({ result: false })
})

app.get("/", (req, res) => {
    res.json({ message: "Hello" })
})

app.post("/create-user", async (req, res) => {
    const { name, last_name, address, phone, email, rol, password } = req.body
    const passwordHash = await bcryptjs.hash(password, 8)
    const [data] = await pool.query("INSERT INTO users (name, last_name, address, phone, email, password, rol) VALUES(?,?,?,?,?,?,?)",
        [name, last_name, address, phone, email, passwordHash, rol])
    return res.json({ id: data.insertId })
})

app.post("/get-user", async (req, res) => {
    const { id } = req.body
    const [data] = await pool.query("SELECT id, name, last_name, address, phone, email, rol FROM users WHERE id = ?", [id])
    res.json(data[0])
})

app.get("/get-users", async (req, res) => {
    const [data] = await pool.query("SELECT id,name,last_name,address,phone,email,rol FROM users")
    res.json(data)
})

app.post("/delete-user", async (req, res) => {
    const { id } = req.body
    const [data] = await pool.query("DELETE FROM users WHERE id = ?", [id])
    res.json({ data })
})

app.post("/login", async (req, res) => {
    const { email, password } = req.body
    const [dataEmail] = await pool.query("SELECT email FROM users WHERE email = ?", [email])
    if (dataEmail.length === 0) return res.json({ result: false })
    const [dataPassword] = await pool.query("SELECT id, password FROM users WHERE email = ?", [dataEmail[0].email])

    const compare = await bcryptjs.compare(password, dataPassword[0].password)

    if (compare) return res.json({ result: dataPassword[0].id })
    return res.json({ result: false })
})
app.get("/get-categories", async (req, res) => {
    const [data] = await pool.query("SELECT * FROM categories")
    res.json(data)
})


app.get("/get-products", async (req, res) => {
    const [data] = await pool.query("SELECT p.id, p.name, p.description, p.dimensions, p.price, p.stock, p.image, c.name as category_name, c.id as category_id FROM products p INNER JOIN categories c ON p.category_id = c.id;")
    res.json(data)
})

app.post("/create-product", async (req, res) => {
    const { name, dimensions, stock, price, image, category, description } = req.body
    const [data] = await pool.query("INSERT INTO products (name, description, dimensions, price,stock, image, category_id) VALUES (?,?,?,?,?,?,?)", [name, description, dimensions, price, stock, image, category])
    res.json({ id: data.insertId })
})

app.post("/delete-product", async (req, res) => {
    const { id } = req.body
    const [data] = await pool.query("DELETE FROM products WHERE id=?", [id])
    res.json({ data })
})

app.post("/update-product", async (req, res) => {
    const { id, name, dimensions, stock, price, image, category, description } = req.body
    const [data] = await pool.query("UPDATE products SET name = ?, description = ?, dimensions = ?, price = ?, stock = ?, image = ?, category_id = ? WHERE id = ?", [name, description, dimensions, price, stock, image, category, id])
    return res.json({ data })
})

app.post("/update-user", async (req, res) => {
    const { id, name, last_name, address, phone, email, rol } = req.body
    const [data] = await pool.query("UPDATE users SET name = ?, last_name = ?, address = ?, phone = ?, email = ?, rol = ? WHERE id = ?", [name, last_name, address, phone, email, rol, id])
    return res.json({ data })
})

app.post("/create-sale", async (req, res) => {
    const { user_id } = req.body
    const [data] = await pool.query("INSERT INTO sales (user_id) VALUES (?)", [user_id])
    return res.json({ id: data.insertId })
})

app.post("/update-stock", async (req, res) => {
    const { amount, stock, product_id } = req.body
    const [data] = await pool.query("UPDATE products SET stock = ? WHERE id = ?", [stock - amount, product_id])
    return res.json({ data })
})

app.post("/create-sale-detail", async (req, res) => {
    const { amount, product_id, sale_id } = req.body
    const [data] = await pool.query("INSERT INTO sales_detail (amount, product_id, sale_id) VALUES (?,?,?)", [amount, product_id, sale_id])
    return res.json({ id: data.insertId })
})

app.post("/get-sales", async (req, res) => {
    const { user_id } = req.body
    const [data] = await pool.query("SELECT s.id, s.sale_date, COUNT(*) as quantity, SUM(p.price * sd.amount) as total FROM `sales_detail` sd INNER JOIN sales s ON sd.sale_id = s.id INNER JOIN products p ON sd.product_id = p.id WHERE s.user_id = ? GROUP BY sd.sale_id;", [user_id])
    res.json(data)
})

app.listen(PORT)
console.log(`SERVER CORRIENDO EN EL PUERTO ${PORT}`)