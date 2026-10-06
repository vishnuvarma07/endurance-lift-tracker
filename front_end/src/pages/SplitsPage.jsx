import EditablePlanCard from "../components/EditablePlanCard";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./SplitsPage.css";

import Navbar from "../components/Navbar"

const API_URL = import.meta.env.VITE_API_URL;

function SplitsPage() {
    const [splits, setSplits] = useState([]);
    const [newSplitName, setNewSplitName] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        const getSplits = async () => {
            const token = localStorage.getItem("token");

            const response = await fetch(`${API_URL}/splits`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (!response.ok) {
                alert("Could not load splits.");
                return;
            }

            const data = await response.json();
            setSplits(data);
        };

        getSplits();
    }, []);

    const handleAddSplit = async (e) => {
        e.preventDefault();

        const token = localStorage.getItem("token");

        const response = await fetch(`${API_URL}/splits`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body:JSON.stringify({ name: newSplitName }),
        });

        if(!response.ok) {
            alert("Could not add split.");
            return;
        }

        const newSplit = await response.json();
        setSplits([...splits, newSplit]);
        setNewSplitName("");

    };

    return <div><Navbar showBack={false}/><main className="page-content">
      <header className="page-heading"><div><p className="eyebrow">YOUR TRAINING SPACE</p><h1>Keep showing up<span className="accent-text">.</span></h1><p className="muted">A little structure. A lot of progress. Let’s get to work.</p></div><span className="status-pill">● Ready to train</span></header>
      <section className="dashboard-banner"><div><p className="eyebrow">MAKE EVERY SESSION COUNT</p><h2>Your plan. Your pace.</h2><p>Build a split, choose your day, and track every set.</p></div><button className="secondary-button" onClick={() => navigate("/stats")}>View your progress ↗</button></section>
      <div className="section-heading"><h2>Training splits <span className="count-badge">{splits.length}</span></h2><span className="muted">Your routines, all in one place</span></div>
      <div className="plan-grid">{splits.map((split, index) => <EditablePlanCard key={split.id} item={split} number={index + 1} kind="split" href={`/splits/${split.id}`} endpoint={`/splits/${split.id}`} onUpdated={updated => setSplits(previous => previous.map(entry => entry.id === updated.id ? updated : entry))} />)}</div>
      {splits.length === 0 && <div className="empty-state"><span className="empty-icon" aria-hidden="true">＋</span><h3>A fresh start for your training.</h3><p>Create your first split below to build your routine.</p></div>}
      <section className="create-panel"><div><h3>Create a new split</h3><p className="muted">Give your next training plan a name.</p></div><form onSubmit={handleAddSplit}><input aria-label="Split name" required  type="text" value={newSplitName} onChange={(e) => setNewSplitName(e.target.value)} placeholder="e.g. Push / Pull / Legs"/><button type="submit">＋ Add split</button></form></section>
    </main></div>;
}
export default SplitsPage;
