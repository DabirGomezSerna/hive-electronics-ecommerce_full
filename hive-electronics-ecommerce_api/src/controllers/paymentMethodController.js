import PaymentMethod from "../models/PaymentMethod.js";

const getPaymentMethods = async (req, res, next) => {
  try {
    const paymentMethods = await PaymentMethod.find().populate("user");

    res.json(paymentMethods);
  } catch (error) {
    next(error);
  }
};

const getPaymentMethodById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const paymentMethod = await PaymentMethod.findById(id).select("-cvv");

    await paymentMethod.populate("user");

    if (!paymentMethod) {
      res.status(404).json({ message: "Payment method not found" });
    } else {
      res.json(paymentMethod);
    }
  } catch (error) {
    next(error);
  }
};

const createPaymentMethod = async (req, res, next) => {
  try {
    const {
      user,
      type,
      cardNumber,
      cardHolderName,
      expiryDate,
      paypalEmail,
      bankName,
      accountNumber,
      isDefault,
      isActive,
      cvv,
    } = req.body;

    if (isDefault) {
      await PaymentMethod.updateMany({ user }, { isDefault: false });
    }

    const newPaymentMethod = await PaymentMethod.create({
      user,
      type,
      cardNumber,
      cardHolderName,
      expiryDate,
      paypalEmail,
      bankName,
      accountNumber,
      isDefault: isDefault || false,
      isActive: isActive || true,
      cvv,
    });

    await newPaymentMethod.populate("user");

    res.status(201).json(newPaymentMethod);
  } catch (error) {
    next(error);
  }
};

const updatePaymentMethod = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      user,
      type,
      cardNumber,
      cardHolderName,
      expiryDate,
      paypalEmail,
      bankName,
      accountNumber,
      isDefault,
      isActive,
      cvv,
    } = req.body;

    if (isDefault) {
      await PaymentMethod.updateMany(
        { user: existing.user, _id: { $ne: id } },
        { isDefault: false },
      );
    }

    const newPaymentMethod = await PaymentMethod.findByIdAndUpdate(
      id,
      {
        user,
        type,
        cardNumber,
        cardHolderName,
        expiryDate,
        paypalEmail,
        bankName,
        accountNumber,
        isDefault: isDefault || false,
        isActive: isActive || true,
        cvv,
      },
      { returnDocument: "after" },
    ).populate("user");

    if (!newPaymentMethod) {
      res.status(404).json({ message: "Payment method not found" });
    } else {
      res.status(200).json(newPaymentMethod);
    }
  } catch (error) {
    next(error);
  }
};

const deletePaymentMethod = async (req, res, next) => {
  try {
    const { id } = req.params;

    const oldPaymentMethod = await PaymentMethod.findByIdAndDelete(id);

    if (!oldPaymentMethod) {
      res.status(404).json({ message: "Payment method not found" });
    } else {
      res.status(204).json({message:"Entry deleted"});
    }
  } catch (error) {
    next(error);
  }
};

export {
  getPaymentMethods,
  getPaymentMethodById,
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
};
