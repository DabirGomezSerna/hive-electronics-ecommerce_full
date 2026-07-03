import Order from "../models/Order.js";

const getOrders = async (req, res, next) => {
  try {
    const orders = await Order.find();

    await orders.populate("user");
    await orders.populate("products.product");
    await orders.populate("address");
    await orders.populate("paymentMethod");

    res.json(orders);
  } catch (error) {
    next(error);
  }
};

const getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id)
      .populate("user")
      .populate("products.product")
      .populate("address")
      .populate("paymentMethod");

    if (!order) {
      res.status(404).json({ message: "Order not found" });
    } else {
      res.json(order);
    }
  } catch (error) {
    next(error);
  }
};

const getOrderByUser = async (req, res, next) => {
  try {
    const userId = req.params.id;

    const order = await Order.find({ user: userId })
      .populate("user")
      .populate("products.product")
      .populate("address")
      .populate("paymentMethod");

    if (!order) {
      return res.status(404).json({ message: "No orders found for this user" });
    }
    res.json(order);
  } catch (error) {
    next(error);
  }
};

const createOrder = async (req, res, next) => {
  try {
    const { user, products, address, paymentMethod, shippingCost } = req.body;

    let total = 0;

    for (let i = 0; i < products.length; i++) {
      total += products[i].price * products[i].quantity;
    }

    total += shippingCost;

    let rounedTotal = parseFloat(total.toFixed(2));

    const newOrder = await Order.create({
      user,
      products,
      address,
      paymentMethod,
      totalPrice: rounedTotal,
      shippingCost,
    });

    await newOrder.populate("user");
    await newOrder.populate("products.product");

    res.status(201).json(newOrder);
  } catch (error) {
    next(error);
  }
};

const updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, paymentStatus } = req.body;

    const updated = await Order.findByIdAndUpdate(
      id,
      { status, paymentStatus },
      { returnDocument: "after" },
    );

    if (!updated) {
      return res.status(204).json({ message: "Order not found" });
    }

    res.json(updated);
  } catch (error) {
    next(error);
  }
};

export {
  getOrders,
  getOrderById,
  getOrderByUser,
  createOrder,
  updateOrderStatus,
};
