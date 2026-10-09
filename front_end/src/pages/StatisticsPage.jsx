import { useEffect, useState } from "react";
import VolumeTrend from "../components/VolumeTrend";
import Navbar from "../components/Navbar";

const API_URL = import.meta.env.VITE_API_URL

function StatisticsPage(){
    const [trendData, setTrendData] = useState(null);

    const [recentWorkouts, setRecentWorkouts] = useState([]);
    const [loadingRecent, setLoadingRecent] = useState(true);
    const [recentError, setRecentError] = useState("");
    const [trendError, setTrendError] = useState("");
    const [reload, setReload] = useState(0);

    useEffect(() => {
        const controller = new AbortController();
        const headers = { Authorization: `Bearer ${localStorage.getItem("token")}` };
        const load = async (path, onSuccess, onError, onComplete = () => {}) => {
            try {
                const response = await fetch(`${API_URL}${path}`, { headers, signal: controller.signal });
                if (!response.ok) throw new Error("Request failed");
                const data = await response.json();
                if (!controller.signal.aborted) onSuccess(data);
            } catch (error) {
                if (error.name !== "AbortError") onError();
            } finally {
                if (!controller.signal.aborted) onComplete();
            }
        };
        load("/stats/volume-trends", setTrendData, () => setTrendError("Could not load volume trends. Please try again."));
        load("/recent/workouts", setRecentWorkouts,
            () => setRecentError("Could not load recent workouts. Please try again."),
            () => setLoadingRecent(false));
        return () => controller.abort();
    }, [reload]);

    return <div><Navbar/><main className="page-content"><header className="page-heading"><div><p className="eyebrow">THE BIGGER PICTURE</p><h1>See your effort add up<span className="accent-text">.</span></h1><p className="muted">Every workout, every set, every rep. It all counts.</p></div><span className="status-pill">All-time progress</span></header>
      {trendError ? <div className="empty-state"><p role="alert">{trendError}</p><button className="secondary-button" onClick={() => { setTrendError(""); setTrendData(null); setReload(value => value + 1); }}>Try again</button></div> : trendData ? <VolumeTrend data={trendData} /> : <p className="empty-state" role="status">Loading volume trends…</p>}
      <section className="recent-workouts" aria-labelledby="recent-heading" aria-busy={loadingRecent}>
        <div className="section-heading"><h2 id="recent-heading">Recent workouts</h2><span className="muted">Your last five sessions</span></div>
        {loadingRecent ? <p className="empty-state" role="status">Loading recent workouts…</p> : recentError ?
          <div className="empty-state"><p role="alert">{recentError}</p><button className="secondary-button" onClick={() => { setLoadingRecent(true); setRecentError(""); setTrendError(""); setReload(value => value + 1); }}>Try again</button></div> :
          recentWorkouts.length === 0 ? <div className="empty-state"><h3>Your history starts with your next session.</h3><p>Finish a workout to see your exercises and sets here.</p></div> :
          <div className="recent-workout-list">{recentWorkouts.map((workout, index) => {
            const exercises = workout.exercises || [];
            const sets = exercises.flatMap(exercise => exercise.sets);
            const volume = sets.reduce((total, set) => total + Number(set.weight) * Number(set.reps), 0);
            // Workout timestamps are stored in UTC; SQLite may omit the timezone suffix.
            const timestamp = /(?:Z|[+-]\d{2}:\d{2})$/i.test(workout.date) ? workout.date : `${workout.date}Z`;
            const date = new Date(timestamp);
            return <article className="recent-workout-card" key={workout.id ?? `${workout.date}-${index}`}>
              <div className="recent-workout-heading"><div><p className="eyebrow">COMPLETED SESSION</p><h3>{workout.day_name}</h3></div><time dateTime={timestamp}>{Number.isNaN(date.getTime()) ? "Date unavailable" : date.toLocaleString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })}</time></div>
              <div className="workout-summary"><span>{exercises.length} exercises</span><span>{sets.length} sets</span><span>{volume.toLocaleString()} lb volume</span></div>
              {exercises.length === 0 ? <p className="muted">No sets logged for this session.</p> : <details><summary>View exercises and sets</summary><div className="workout-history-exercises">{exercises.map(exercise => <section key={exercise.exercise_id}><h4>{exercise.name}</h4><ul>{exercise.sets.map(set => <li key={set.set_number}><span>Set {set.set_number}</span><strong>{set.weight} lb × {set.reps} reps</strong></li>)}</ul></section>)}</div></details>}
            </article>;
          })}</div>}
      </section>
      <section className="dashboard-banner"><div><p className="eyebrow">CONSISTENCY BUILDS STRENGTH</p><h2>Keep the momentum going.</h2><p>Your next session is another chance to move forward.</p></div></section>
    </main></div>;
}
export default StatisticsPage;
