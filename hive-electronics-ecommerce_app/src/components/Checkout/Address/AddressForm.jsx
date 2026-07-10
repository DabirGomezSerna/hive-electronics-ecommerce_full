import { useEffect, useState } from "react";
import Button from "../../common/Button";
import Input from "../../common/Input";
import "./AddressForm.css";

const AddressForm = ({
  onSubmit,
  onCancel,
  initialValues = {},
  isEdit = false,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    address1: "",
    address2: "",
    postalCode: "",
    city: "",
    country: "",
    reference: "",
    default: false,
    ...initialValues,
  });

  // Update form when inital values change (editing)
  useEffect(() => {
    if (initialValues && Object.keys(initialValues).length > 0) {
      setFormData({
        name: "",
        address1: "",
        address2: "",
        postalCode: "",
        city: "",
        country: "",
        reference: "",
        default: false,
        ...initialValues,
      });
    }
  }, [initialValues]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);

    // Reset form if new
    if (!isEdit) {
      setFormData({
        name: "",
        address1: "",
        address2: "",
        postalCode: "",
        city: "",
        country: "",
        reference: "",
        default: false,
      });
    }
  };

  return (
    <form className="address-form" onSubmit={handleSubmit}>
      <h3>{isEdit ? "Edit address" : "New address"}</h3>

      <Input
        label="Address name"
        name="name"
        value={formData.name}
        onChange={handleChange}
        required
      />

      <Input
        label="Address line 1"
        name="address1"
        value={formData.address1}
        onChange={handleChange}
        required
      />

      <Input
        label="Address line 2"
        name="address2"
        value={formData.address2}
        onChange={handleChange}
      />

      <Input
        label="Zip code"
        name="postalCode"
        value={formData.postalCode}
        onChange={handleChange}
        required
      />

      <Input
        label="City"
        name="city"
        value={formData.city}
        onChange={handleChange}
        required
      />

      <Input
        label="Country"
        name="country"
        value={formData.country}
        onChange={handleChange}
        required
      />

      <Input
        label="Reference"
        name="reference"
        value={formData.reference}
        onChange={handleChange}
      />

      <div className="form-checkbox">
        <input
          type="checkbox"
          name="default"
          checked={formData.default}
          onChange={handleChange}
          id="defaultAddress"
        />
        <label htmlFor="defaultAddress">
          Set as default address
        </label>
      </div>

      <div className="form-actions">
        <Button type="submit">
          {isEdit ? "Save changes" : "Add address"}
        </Button>
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
};

export default AddressForm;
