import apiClient from "./apiClient";
import { getCurrentUser } from "./userServices";

export async function getPaymentMethods(userId) {
  return await apiClient(`/payment-methods/user/${userId}`);
}

export async function createPaymentMethod(formData) {
  const user = getCurrentUser();
  return await apiClient("/payment-methods", {
    method: "POST",
    body: JSON.stringify({
      user: user.userId,
      type: formData.type,
      cardNumber: formData.cardNumber,
      cardHolderName: formData.cardHolderName,
      expiryDate: formData.expiryDate,
      cvv: formData.cvv,
      paypalEmail: formData.paypalEmail,
      bankName: formData.bankName,
      accountNumber: formData.accountNumber,
      isDefault: formData.isDefault || false,
    }),
  });
}

export async function updatePaymentMethod(id, formData) {
  return await apiClient(`/payment-methods/${id}`, {
    method: "PUT",
    body: JSON.stringify({
      type: formData.type,
      cardNumber: formData.cardNumber,
      cardHolderName: formData.cardHolderName,
      expiryDate: formData.expiryDate,
      cvv: formData.cvv,
      paypalEmail: formData.paypalEmail,
      bankName: formData.bankName,
      accountNumber: formData.accountNumber,
      isDefault: formData.isDefault || false,
    }),
  });
}

export async function deletePaymentMethod(id) {
  return await apiClient(`/payment-methods/${id}`, { method: "DELETE" });
}
