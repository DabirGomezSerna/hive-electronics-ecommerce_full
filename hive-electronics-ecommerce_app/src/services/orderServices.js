import apiClient from "./apiClient";

export async function createOrder(payload) {
  return await apiClient("/orders", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
