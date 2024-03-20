const express = require("express");
const { connection } = require("./Config/db");
const { userRouter } = require("./Routes/UserRouter");
const { bookRouter } = require("./Routes/BookRouter");
const { orderRouter } = require("./Routes/OrderRouter");
require("dotenv").config();
const PORT = process.env.PORT;
const app = express();
app.use(express.json());

app.use('/',userRouter);
app.use('/books',bookRouter);
app.use('/',orderRouter);

app.listen(PORT, async()=> {
    await connection
    console.log(`Server is live at http://localhost:${PORT} and connected to db`);
})