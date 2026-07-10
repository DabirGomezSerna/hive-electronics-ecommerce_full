import ShippingAddress from "../models/ShippingAddress.js";

const getShippingAddresses = async (req, res, next) => {
  try {
    const addresses = await ShippingAddress.find().populate("user");

    if (!addresses) {
      res.status(404).json({ message: "Addresses not found" });
    } else {
      res.status(200).json(addresses);
    }
  } catch (error) {
    next(error);
  }
};

const getShippingAddressesByUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const addresses = await ShippingAddress.find({ user: id }).populate("user");
    res.status(200).json(addresses);
  } catch (error) {
    next(error);
  }
};

const getShippingAddressById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const address = await ShippingAddress.findById(id).populate("user");

    if (!address) {
      res.status(404).json({ message: "Address not found" });
    } else {
      res.json(address);
    }
  } catch (error) {
    next(error);
  }
};

const createShippingAddress = async (req, res, next) => {
  try {
    const {
      user,
      name,
      address1,
      address2,
      postalCode,
      city,
      country,
      reference,
      defaultAddress,
    } = req.body;

    const newAddress = await ShippingAddress.create({
      user,
      name,
      address1,
      address2,
      postalCode,
      city,
      country,
      reference,
      defaultAddress,
    });

    await newAddress.populate("user");

    res.status(201).json(newAddress);
  } catch (error) {
    next(error);
  }
};

const updateShippingAddress = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      name,
      address1,
      address2,
      postalCode,
      city,
      country,
      reference,
      defaultAddress,
    } = req.body;

    const newAddress = await ShippingAddress.findByIdAndUpdate(
      id,
      {
        name,
        address1,
        address2,
        postalCode,
        city,
        country,
        reference,
        defaultAddress,
      },
      { returnDocument: "after" },
    );

    if (!newAddress) {
      res.status(404).json({ message: "Address not found" });
    } else {
      res.status(200).json(newAddress);
    }
  } catch (error) {
    next(error);
  }
};

const deleteShippingAddress = async (req, res, next) => {
  try {
    const { id } = req.params;

    const address = await ShippingAddress.findByIdAndDelete(id);

    if (!address) {
      res.status(404).json({ message: "Address not found" });
    } else {
      res.status(204).json({message:"Entry deleted"});
    }
  } catch (error) {
    next(error);
  }
};

export {
  getShippingAddresses,
  getShippingAddressesByUser,
  getShippingAddressById,
  createShippingAddress,
  updateShippingAddress,
  deleteShippingAddress,
};
