import Cart from "../models/Cart.js";

const getCarts = async (req, res, next) => {
  try {
    const carts = await Cart.find()
      .populate("user")
      .populate("products.product");

    res.json(carts);
  } catch (error) {
    next(error);
  }
};

const getCartById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const cart = await Cart.findById(id)
      .populate("user")
      .populate("products.product");

    if (!cart) {
      res.status(404).json({ message: "Cart not found" });
    } else {
      res.json(cart);
    }
  } catch (error) {
    next(error);
  }
};

const getCartByUser = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const cart = await Cart.findOne({ user: userId })
      .populate("user")
      .populate("products.product");
    if (!cart) {
      return res.status(404).json({ message: "No cart found for this user" });
    }
    res.json(cart);
  } catch (error) {
    next(error);
  }
};

const createCart = async (req, res, next) => {
  try {
    const { user, products } = req.body;

    if (!user) {
      return res.status(400).json({ error: "User is required" });
    } else if (!products || !Array.isArray(products)) {
      return res.status(400).json({ error: "Products array is required" });
    }

    for (let i = 0; i < products.length; i++) {
      if (!products[i].product) {
        return res
          .status(400)
          .json({ error: "Products must have a Product id" });
      } else if (!products[i].quantity || products[i].quantity < 1) {
        return res
          .status(400)
          .json({ error: "Product quantity must be greater than 0" });
      }
    }

    const newCart = await Cart.create({
      user,
      products,
    });

    await newCart.populate("user");
    await newCart.populate("products.product");

    res.status(201).json(newCart);
  } catch (error) {
    next(error);
  }
};

const updateCart = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { user, products } = req.body;

    if (!user) {
      return res.status(400).json({ error: "User is required" });
    } else if (!products || !Array.isArray(products)) {
      return res.status(400).json({ error: "Products array is required" });
    }

    for (let i = 0; i < products.length; i++) {
      if (!products[i].product) {
        return res
          .status(400)
          .json({ error: "Products must have a Product id" });
      } else if (!products[i].quantity || products[i].quantity < 1) {
        return res
          .status(400)
          .json({ error: "Product quantity must be greater than 0" });
      }
    }

    const newCart = await Cart.findByIdAndUpdate(
      id,
      { user, products },
      { returnDocument: "after" },
    )
      .populate("user")
      .populate("products.product");

    if (!newCart) {
      res.status(404).json({ message: "Cart not found" });
    } else {
      res.status(200).json(newCart);
    }
  } catch (error) {
    next(error);
  }
};

const deleteCart = async (req, res, next) => {
  try {
    const { id } = req.params;

    const cart = await Cart.findByIdAndDelete(id);

    if (!cart) {
      res.status(404).json({ message: "Cart not found" });
    } else {
      res.status(204).json({message:"Entry deleted"});
    }
  } catch (error) {
    next(error);
  }
};

const addProductToCart = async (req, res, next) => {
  try {
    const { userId, productId, quantity = 1 } = req.body;
    let cart = await Cart.findOne({ user: userId });

    if (!cart) {
      cart = new Cart({
        user: userId,
        products: [{ product: productId, quantity }],
      });
    } else {
      const existingProductIndex = cart.products.findIndex(
        (item) => item.product.toString() === productId,
      );

      if (existingProductIndex >= 0) {
        cart.products[existingProductIndex].quantity += quantity;
      } else {
        cart.products.push({ product: productId, quantity });
      }
    }

    await cart.save();
    await cart.populate("user");
    await cart.populate("products.product");

    res.json(cart);
  } catch (error) {
    next(error);
  }
};

const removeProductFromCart = async (req, res, next) => {
  try {
    const { userId, productId, quantity = 1 } = req.body;
    let cart = await Cart.findOne({ user: userId });

    if (!cart) {
      res.status(404).json({ message: "No cart found for user" });
    } else {
      const existingProductIndex = cart.products.findIndex(
        (item) => item.product.toString() === productId,
      );

      if (existingProductIndex >= 0) {
        cart.products[existingProductIndex].quantity === 1
          ? cart.products.splice(existingProductIndex, 1)
          : (cart.products[existingProductIndex].quantity -= 1);
      } else {
        res.status(404).json({ message: "Product not found in cart" });
      }

      await cart.save();
      await cart.populate("user");
      await cart.populate("products.product");

      res.json(cart);
    }
  } catch (error) {
    next(error);
  }
};

export {
  getCarts,
  getCartById,
  getCartByUser,
  createCart,
  addProductToCart,
  removeProductFromCart,
  updateCart,
  deleteCart,
};
