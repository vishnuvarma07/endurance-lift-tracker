import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL;

function RegistrationPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    const navigate = useNavigate()

    const handleRegister = async (e) => {
        e.preventDefault();
        const response = await fetch(`${API_URL}/register`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({username, password}),
        });

        if (response.ok) {
            alert("Registration successful! Please log in.");
            setUsername("");
            setPassword("");
            navigate("/")
        } else {
            alert("Registration failed. Please try again.");
        }
    }

    return (
      <main className="auth-layout">
        <section className="auth-story">
          <div className="brand"><span className="brand-mark" aria-hidden="true">E</span>ENDURANCE<span className="brand-dot">.</span></div>
          <div className="auth-story-content"><p className="eyebrow">BUILT FOR THE LONG GAME</p><h1>Small steps.<br />Stronger you<span className="accent-text">.</span></h1><p>Plan your training. Track every rep.<br />See how far you can go.</p><div className="training-art" aria-hidden="true"><div></div><div></div><div></div><div></div><div></div><div></div><div></div></div><span className="art-caption">SHOW UP. PUT IN THE WORK. REPEAT.</span></div>
          <p className="auth-footer">Your progress, one session at a time.</p>
        </section>
        <section className="auth-panel"><div className="auth-card"><p className="eyebrow">LET’S GET TO WORK</p><h2>Build your momentum.</h2><p className="muted">Create your account and make every session count.</p>
          <form className="auth-form" onSubmit={handleRegister}>
            <label>Username<input required autoComplete="username" type="text" placeholder="Enter your username" value={username} onChange={(e) => setUsername(e.target.value)} /></label>
            <label>Password<input required autoComplete="new-password" type="password" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} /></label>
            <button type="submit">Create account <span aria-hidden="true">→</span></button>
          </form>
          <p className="auth-switch">Already have an account? <button className="text-button" onClick={() => navigate("/")}>Sign in</button></p>
        </div></section>
      </main>
    );
}
export default RegistrationPage;
