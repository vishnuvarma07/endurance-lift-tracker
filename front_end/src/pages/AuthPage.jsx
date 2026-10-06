import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL;

function AuthPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    const [isSigningIn, setIsSigningIn] = useState(false);
    const signingInRef = useRef(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();

        if (signingInRef.current) return;
        signingInRef.current = true;
        setIsSigningIn(true);
        try {
            const formData = new URLSearchParams();
            formData.append("username", username);
            formData.append("password", password);

            const response = await fetch(`${API_URL}/login`, {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: formData,
            });
            if (!response.ok) {
                alert("Login failed. Please try again.");
                setPassword("");
                return;
            }
            const data = await response.json();
            localStorage.setItem("token", data.access_token);
            navigate("/splits");
        } catch {
            alert("Could not sign in. Please try again.");
        } finally {
            signingInRef.current = false;
            setIsSigningIn(false);
        }
    };

    return (
      <main className="auth-layout">
        <section className="auth-story">
          <div className="brand"><span className="brand-mark" aria-hidden="true">E</span>ENDURANCE<span className="brand-dot">.</span></div>
          <div className="auth-story-content"><p className="eyebrow">BUILT FOR THE LONG GAME</p><h1>Small steps.<br />Stronger you<span className="accent-text">.</span></h1><p>Plan your training. Track every rep.<br />See how far you can go.</p><div className="training-art" aria-hidden="true"><div></div><div></div><div></div><div></div><div></div><div></div><div></div></div><span className="art-caption">SHOW UP. PUT IN THE WORK. REPEAT.</span></div>
          <p className="auth-footer">Your progress, one session at a time.</p>
        </section>
        <section className="auth-panel"><div className="auth-card"><p className="eyebrow">LET’S GET TO WORK</p><h2>Welcome back.</h2><p className="muted">Your next personal best starts here.</p>
          <form className="auth-form" onSubmit={handleLogin}>
            <label>Username<input required autoComplete="username" type="text" placeholder="Enter your username" value={username} onChange={(e) => setUsername(e.target.value)} /></label>
            <label>Password<input required autoComplete="current-password" type="password" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} /></label>
            <button type="submit" disabled={isSigningIn} aria-busy={isSigningIn}>{isSigningIn ? "Signing in..." : "Sign in"} <span aria-hidden="true">→</span></button>
          </form>
          <p className="auth-switch">New to Endurance? <button className="text-button" onClick={() => navigate("/register")}>Create an account</button></p>
        </div></section>
      </main>
    );
}
export default AuthPage;
