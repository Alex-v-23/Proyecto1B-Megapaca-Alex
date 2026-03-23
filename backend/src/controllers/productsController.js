//Creo un array de métodos
const productsController = {};

//Import el Schema de la colección que
//vamos a utilizar
import productsModel from "../models/products.js";

//SELECT
productsController.getProducts = async (req, res) => {
  const products = await productsModel.find();
  res.json(products);
};

//INSERT
productsController.insertProducts = async (req, res) => {
  //#1- Solicito los datos a guardar
  const { name, description, price, stock } = req.body;
  //#2- Lleno una instacia de mi Schema
  const newProduct = new productsModel({ name, description, price, stock });
  //#3- guardo en la base de datos
  await newProduct.save();

  res.json({ message: "Product saved" });
};

//ELIMINAR
productsController.deleteProducts = async (req, res) => {
  await productsModel.findByIdAndDelete(req.params.id);
  res.json({ message: "Product deleted" });
};

//ACTUALIZAR
productsController.updateProducts = async (req, res) => {
  //#1- pido los nuevos datos
  const { name, description, price, stock } = req.body;
  //#2- actualizo los datos
  await productsModel.findByIdAndUpdate(
    req.params.id,
    {
      name,
      description,
      price,
      stock,
    },
    { new: true },
  );

  res.json({ message: "product updated" });
};

export default productsController;
