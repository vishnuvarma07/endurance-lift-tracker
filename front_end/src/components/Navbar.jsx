import { NavLink, useNavigate } from "react-router-dom";
import "./Navbar.css";
export default function Navbar({ showBack = true }) {
  const navigate = useNavigate();
  return <nav className="navbar" aria-label="Main navigation">
    <NavLink className="brand" to="/splits"><span className="brand-mark" aria-hidden="true">E</span>ENDURANCE<span className="brand-dot">.</span></NavLink>
    <div className="nav-links"><NavLink to="/splits">Training</NavLink><NavLink to="/stats">Statistics</NavLink></div>
    <div className="nav-actions">{showBack && <button className="navbar-back" onClick={() => navigate(-1)}>← Back</button>}<button className="quiet-button" onClick={() => { localStorage.removeItem("token"); navigate("/"); }}>Sign out</button></div>
  </nav>;
}
