const express = require("express");
const { connection } = require("./Config/db");
require("dotenv").config();
const PORT = process.env.PORT;
const app = express();

app.get('/',(req,res)=> {
  res.send({"msg":"homepage"})
})

app.listen(PORT, async()=> {
    await connection
    console.log(`Server is live at http://localhost:${PORT} and connected to db`);
})