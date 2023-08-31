const express = require("express")
const http = require("http");
const WebSocket = require("ws");
const path = require("path");
const hbs = require("express-handlebars");
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);
const port = 8080;
const wss = new WebSocket.Server({ server });
const io = socketIo(server);
const productRoutes = require("./routes/productRoutes");
const cartRoutes = require("./routes/cartRoutes");
const { default: mongoose } = require("mongoose");

const URI ="mongodb+srv://matiaslagoscarro:lFyL3RLNo4tpDowe@cluster0.kglh74l.mongodb.net/PreEntrega2?retryWrites=true&w=majority";

mongoose.connect(URI)
.then(() => console.log("Conectado a la base de datos"))
.catch((error) => console.log(error));

app.engine(
  "handlebars",
  hbs.engine({
    layoutsDir: path.join(__dirname, "views", "layouts"),
  })
);
app.set("view engine", "handlebars");
app.set("views", path.join(__dirname, "views"));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(productRoutes);
app.use(cartRoutes);
app.use("/api/products", productRoutes);
app.use("/api/carts", cartRoutes);

wss.on("connection", (ws) => {
  console.log("Nueva conexión");
  ws.on("close", () => {
    console.log("Conexión cerrada");
  });
});

io.on("connection", (socket) => {
  console.log("Cliente Socket.IO conectado");

  socket.on("new_product", async (productData) => {
    try {
      const newProduct = await Product.create(productData);
      io.emit("product_added", newProduct);
    } catch (error) {
      console.error("Error al agregar el producto:", error);
    }
  });

  socket.on("delete_product", async (productId) => {
    try {
      const deletedProduct = await Product.findByIdAndDelete(productId);
      io.emit("product_deleted", deletedProduct);
    } catch (error) {
      console.error("Error al eliminar el producto:", error);
    }
  });

  socket.on("disconnect", () => {
    console.log("Cliente Socket.IO desconectado");
  });
});

server.listen(port, () => {
  console.log(`Servidor Express corriendo en http://localhost:${port}`);
});
