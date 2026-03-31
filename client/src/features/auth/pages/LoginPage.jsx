import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Input } from "@components/ui";
import Button from "@components/common/Button";
import { useAuthStore, useUIStore } from "@store";
import { getDashboardPath } from "@utils";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore((state) => state.login);
  const loading = useAuthStore((state) => state.loading);
  const showToast = useUIStore((state) => state.showToast);
  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    try {
      const user = await login(form);
      showToast("Logged in successfully");
      const redirectTo = location.state?.from?.pathname || getDashboardPath(user?.role);
      navigate(redirectTo, { replace: true });
    } catch (authError) {
      setError(authError.message || "Unable to sign in");
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-dark">Welcome back</h1>
      <p className="mt-2 text-sm text-slate-500">
        Sign in to your FindOne account
      </p>

      <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
        <Input
          label="Email"
          name="email"
          type="email"
          placeholder="you@example.com"
          value={form.email}
          onChange={handleChange}
          required
        />
        <Input
          label="Password"
          name="password"
          type="password"
          placeholder="Enter your password"
          value={form.password}
          onChange={handleChange}
          required
        />

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-primary-500 focus:ring-primary-500" />
            <span className="text-sm text-slate-600">Remember me</span>
          </label>
          <button
            type="button"
            className="text-sm font-medium text-primary-500 hover:text-primary-600"
            onClick={() =>
              showToast(
                "Password reset is not live yet. Please create a new account or use your existing one.",
                "error"
              )
            }
          >
            Forgot password?
          </button>
        </div>

        {error ? <p className="text-sm text-red-500">{error}</p> : null}

        <Button variant="primary" size="lg" className="w-full justify-center" type="submit" loading={loading}>
          Sign In
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        Don't have an account?{" "}
        <Link to="/register" className="font-semibold text-primary-500 hover:text-primary-600">
          Sign up
        </Link>
      </p>
    </div>
  );
}
