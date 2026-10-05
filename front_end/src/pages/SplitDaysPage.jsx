import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

import Navbar from "../components/Navbar"
import "./SplitDaysPage.css"

const API_URL = import.meta.env.VITE_API_URL;


function SplitDaysPage() {
    const { splitId } = useParams();
    const navigate = useNavigate();

    const [split, setSplit] = useState(null)
    const [days, setDays] = useState([]);
    const [newDayName, setNewDayName] = useState("");

    useEffect(() => {
        const getDays = async () => {
            const token = localStorage.getItem("token");

            const response = await fetch(
                `${API_URL}/splits/${splitId}/days`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            if (!response.ok) {
                alert("Could not load split days.");
                return;
            }

            const data = await response.json();
            setDays(data);

            const splitResponse = await fetch(
                `${API_URL}/splits/${splitId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            if (!splitResponse.ok) {
                alert("Could not load split");
                return;
            }

            const splitData = await splitResponse.json();
            setSplit(splitData);

        };

        getDays();
    }, [splitId]);

    const handleAddDay = async (e) => {
        e.preventDefault();

        const token = localStorage.getItem("token");

        const response = await fetch(
            `${API_URL}/splits/${splitId}/days`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: newDayName
                })
            }
        );

        if (!response.ok) {
            alert("Could not add day.");
            return;
        }

        const newDay = await response.json();

        setDays([...days, newDay]);
        setNewDayName("");
    };

    return <div><Navbar/><main className="page-content"><header className="page-heading"><div><p className="eyebrow">TRAINING PLAN</p><h1>{split?.name || "Your training plan"}</h1><p className="muted">Pick a day and turn your plan into progress.</p></div><span className="status-pill">{days.length} training days</span></header>
      <div className="section-heading"><h2>Your training days</h2></div><div className="plan-grid">{days.map((day, index) => <button key={day.id} className="plan-card" onClick={() => navigate(`/splits/${splitId}/days/${day.id}`)}><span className="plan-number">DAY {String(index + 1).padStart(2, "0")}</span><h3>{day.name}</h3><span className="card-bottom">Start your session <span>→</span></span></button>)}</div>
      {days.length === 0 && <div className="empty-state"><h3>Build your weekly rhythm.</h3><p>Add a training day to start organizing your exercises.</p></div>}
      <section className="create-panel"><div><h3>Add a training day</h3><p className="muted">Make room for your next session.</p></div><form onSubmit={handleAddDay}><input required aria-label="Day name" value={newDayName} onChange={(e) => setNewDayName(e.target.value)} placeholder="e.g. Upper body"/><button type="submit">＋ Add day</button></form></section>
    </main></div>;
}
export default SplitDaysPage;
