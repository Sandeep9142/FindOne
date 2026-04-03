import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Input } from "@components/ui";
import Button from "@components/common/Button";
import { useAuthStore, useUIStore } from "@store";
import { cn, getDashboardPath } from "@utils";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const requestedRole = searchParams.get("role");
  const defaultRole = requestedRole === "worker" ? "worker" : "client";
  const register = useAuthStore((state) => state.register);
  const loading = useAuthStore((state) => state.loading);
  const showToast = useUIStore((state) => state.showToast);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    role: defaultRole,
  });
  const [error, setError] = useState("");

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function handleRoleChange(role) {
    setForm((current) => ({ ...current, role }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    try {
      const payload = {
        fullName: `${form.firstName} ${form.lastName}`.trim(),
        email: form.email,
        password: form.password,
        role: form.role,
      };

      if (form.phone?.trim()) {
        payload.phone = form.phone.trim();
      }

      const user = await register({
        ...payload,
      });

      showToast("Account created successfully");
      navigate(getDashboardPath(user?.role), { replace: true });
    } catch (registerError) {
      setError(registerError.message || "Unable to create account");
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-dark">Create your account</h1>
      <p className="mt-2 text-sm text-slate-500">
        Join 50,000+ users on FindOne
      </p>

      <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="First Name"
            name="firstName"
            placeholder="John"
            value={form.firstName}
            onChange={handleChange}
            required
          />
          <Input
            label="Last Name"
            name="lastName"
            placeholder="Doe"
            value={form.lastName}
            onChange={handleChange}
            required
          />
        </div>
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
          label="Phone"
          name="phone"
          type="tel"
          placeholder="+91 98765 43210"
          value={form.phone}
          onChange={handleChange}
        />
        <Input
          label="Password"
          name="password"
          type="password"
          placeholder="Create a strong password"
          value={form.password}
          onChange={handleChange}
          required
        />

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            I want to
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleRoleChange("client")}
              className={cn(
                "px-4 py-3 rounded-xl border-2 text-sm font-semibold text-center transition-colors",
                form.role === "client"
                  ? "border-primary-500 bg-primary-50 text-primary-600"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
              )}
            >
              Hire Workers
            </button>
            <button
              type="button"
              onClick={() => handleRoleChange("worker")}
              className={cn(
                "px-4 py-3 rounded-xl border-2 text-sm font-semibold text-center transition-colors",
                form.role === "worker"
                  ? "border-primary-500 bg-primary-50 text-primary-600"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
              )}
            >
              Find Work
            </button>
          </div>
        </div>

        {error ? <p className="text-sm text-red-500">{error}</p> : null}

        <Button variant="gradient" size="lg" className="w-full justify-center" type="submit" loading={loading}>
          Create Account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        Already have an account?{" "}
        <Link to="/login" className="font-semibold text-primary-500 hover:text-primary-600">
          Sign in
        </Link>
      </p>
    </div>
  );
}
