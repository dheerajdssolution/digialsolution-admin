"use client";

import { useState } from "react";
import { useAdminAuth } from "./AdminAuthProvider";

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500";

export default function LoginScreen() {
  const { authenticate } = useAdminAuth();
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [registrationKey, setRegistrationKey] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const registration = mode === "register";
      if (registration && password.length < 12)
        throw new Error("Use a password with at least 12 characters.");
      await authenticate(
        registration ? "/auth/register" : "/auth/login",
        registration
          ? { name, email, password, registrationKey }
          : { email, password },
      );
    } catch (issue) {
      setError(issue.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center px-5">
      <form
        onSubmit={submit}
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/60"
      >
        <img
          src="/ds-solution-logo.png"
          alt="DS Solution"
          className="mb-7 h-auto w-56"
        />
        <h1 className="text-2xl font-bold">
          {mode === "login" ? "Admin sign in" : "Register admin account"}
        </h1>
        <p className="mt-2 mb-6 text-sm text-slate-500">
          {mode === "login"
            ? "Sign in to manage the website content."
            : "Admin accounts require a private invitation key."}
        </p>
        {error && (
          <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}
        {mode === "register" && (
          <div className="mb-4">
            <label>Name</label>
            <input
              className={inputClass}
              autoComplete="name"
              required
              minLength={2}
              maxLength={120}
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>
        )}
        <div className="mb-4">
          <label>Email</label>
          <input
            className={inputClass}
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>
        <div className="mb-4">
          <label>
            Password{" "}
            {mode === "register" && (
              <span className="font-normal text-slate-400">
                (12+ characters)
              </span>
            )}
          </label>
          <input
            className={inputClass}
            type="password"
            autoComplete={
              mode === "login" ? "current-password" : "new-password"
            }
            required
            minLength={mode === "register" ? 12 : undefined}
            maxLength={128}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>
        {mode === "register" && (
          <div className="mb-6">
            <label>Admin invitation key</label>
            <input
              className={inputClass}
              type="password"
              required
              value={registrationKey}
              onChange={(event) => setRegistrationKey(event.target.value)}
            />
          </div>
        )}
        <button
          disabled={busy}
          className="w-full rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {busy
            ? "Please wait…"
            : mode === "login"
              ? "Sign in"
              : "Create admin account"}
        </button>
        <p className="mt-5 text-center text-sm text-slate-500">
          {mode === "login" ? "Need an admin account?" : "Already registered?"}{" "}
          <button
            type="button"
            className="font-semibold text-indigo-700"
            onClick={() => {
              setMode(mode === "login" ? "register" : "login");
              setError("");
            }}
          >
            {mode === "login" ? "Register" : "Sign in"}
          </button>
        </p>
      </form>
    </main>
  );
}
