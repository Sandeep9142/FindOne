export function getDashboardPath(role) {
  switch (role) {
    case "worker":
      return "/dashboard/worker";
    case "admin":
      return "/dashboard/admin";
    case "client":
    default:
      return "/dashboard/client";
  }
}
