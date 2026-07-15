import { useState } from "react";
import type React from "react";
import { LogIn } from "lucide-react";
import { login, requestPasswordReset, verifyMfa, type SessionUser } from "../api";

export function LoginPanel({ onLogin }: { onLogin: (user: SessionUser) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [recoveryMessage, setRecoveryMessage] = useState("");
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaCode, setMfaCode] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    try {
      const result = await login(email, password);
      if ("mfaRequired" in result) {
        setMfaRequired(true);
        return;
      }
      onLogin(result);
    } catch {
      setError("Credenciales invalidas o cuenta bloqueada temporalmente.");
    }
  }

  async function verifySecondFactor(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    try {
      onLogin(await verifyMfa(mfaCode));
    } catch {
      setError("Código de verificación inválido o vencido.");
    }
  }

  async function recover() {
    setError("");
    setRecoveryMessage("");
    try {
      const result = await requestPasswordReset(email);
      setRecoveryMessage(result.detail);
    } catch {
      setError("No se pudo procesar la solicitud. Intente nuevamente más tarde.");
    }
  }

  return (
    <main className="login-screen">
      <form className="login-card" onSubmit={mfaRequired ? verifySecondFactor : submit}>
        <LogIn size={28} />
        <h1>Portal administrativo</h1>
        {mfaRequired ? (
          <>
            <p>Ingrese el código temporal de su aplicación autenticadora.</p>
            <label>Código de verificación<input inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6,8}" minLength={6} maxLength={8} required autoFocus value={mfaCode} onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ""))} /></label>
            <button className="primary">Verificar</button>
            <button className="ghost" type="button" onClick={() => { setMfaRequired(false); setMfaCode(""); setPassword(""); }}>Volver al acceso</button>
          </>
        ) : (
          <>
            <label>Correo<input type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} /></label>
            <label>Contraseña<input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} /></label>
            <button className="primary">Entrar</button>
            <button className="ghost" type="button" onClick={recover}>Olvidé mi contraseña</button>
          </>
        )}
        {recoveryMessage && <p className="success" role="status">{recoveryMessage}</p>}
        {error && <p className="error">{error}</p>}
      </form>
    </main>
  );
}
