/** Chỉ email này được xem full app (bảng giá, cài đặt, agent, …) */
export const ADMIN_EMAIL = "hr.vanmai@gmail.com";

export function isAdminEmail(email?: string | null) {
  return (email || "").toLowerCase().trim() === ADMIN_EMAIL;
}
