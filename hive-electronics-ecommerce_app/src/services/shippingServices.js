import apiClient from "./apiClient";
import { getCurrentUser } from "./userServices";

export async function getShippingAddresses(userId) {
  return await apiClient(`/addresses/user/${userId}`);
}

export async function createShippingAddress(formData) {
  const user = getCurrentUser();
  return await apiClient("/addresses", {
    method: "POST",
    body: JSON.stringify({
      user: user.userId,
      name: formData.name,
      address1: formData.address1,
      address2: formData.address2,
      postalCode: formData.postalCode,
      city: formData.city,
      country: formData.country,
      reference: formData.reference,
      defaultAddress: formData.default,
    }),
  });
}

export async function updateShippingAddress(id, formData) {
  return await apiClient(`/addresses/${id}`, {
    method: "PUT",
    body: JSON.stringify({
      name: formData.name,
      address1: formData.address1,
      address2: formData.address2,
      postalCode: formData.postalCode,
      city: formData.city,
      country: formData.country,
      reference: formData.reference,
      defaultAddress: formData.default,
    }),
  });
}

export async function deleteShippingAddress(id) {
  return await apiClient(`/addresses/${id}`, { method: "DELETE" });
}
