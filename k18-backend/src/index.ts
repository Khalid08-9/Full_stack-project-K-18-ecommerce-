import express from "express";
import cors from "cors";
import productsRouter from "./routes/products";
import authRouter from "./routes/auth";
import usersRouter from "./routes/users";
import ordersRouter from "./routes/order";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("K18 API is running");
});

app.use("/api/products", productsRouter);
app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);
app.use("/api/orders", ordersRouter);

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});