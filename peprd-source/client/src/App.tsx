import { Navigate } from "react-router-dom";

// Root path just funnels to the admin dashboard. No public marketing site here —
// the public website is peprd.io.
export default function App() {
  return <Navigate to="/dashboard" replace />;
}
