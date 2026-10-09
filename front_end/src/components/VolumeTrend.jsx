import { useState } from "react";

import { selectVolumePoints, selectExerciseMaxPoints } from "../volumeTrends";

const formatDate = date => new Date(date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });

export default function VolumeTrend({ data }) {
    const [mode, setMode] = useState("day");
    const [selectedDay, setSelectedDay] = useState("");
    const [selectedExercise, setSelectedExercise] = useState("");
    const dayId = data.days.some(day => String(day.id) === selectedDay) ? selectedDay : String(data.days[0]?.id ?? "");
    const exercises = data.exercises.filter(exercise => String(exercise.day_id) === dayId);
    const exerciseId = mode === "exercise" ? (exercises.some(exercise => String(exercise.id) === selectedExercise) ? selectedExercise : String(exercises[0]?.id ?? "")) : "";
    const isExercise = mode === "exercise";
    const points = isExercise ? selectExerciseMaxPoints(data.sessions, dayId, exerciseId) : selectVolumePoints(data.sessions, dayId, "");
    const metric = isExercise ? "Estimated 1RM" : "Volume";
    const formatValue = value => value.toLocaleString(undefined, { maximumFractionDigits: 1 });
    const pointDescription = point => `${formatDate(point.date)}${isExercise ? ` · Set ${point.setNumber} (${point.weight} lb × ${point.reps})` : ""}`;
    const [selectedPoint, setSelectedPoint] = useState(null);
    const active = points.find(point => String(point.id) === selectedPoint) ?? points.at(-1);
    const max = Math.max(1, ...points.map(point => point.volume)) * 1.1;
    const times = points.map(point => new Date(point.date).getTime());
    const start = times[0] ?? 0;
    const range = (times.at(-1) ?? 0) - start;
    const x = index => range ? 80 + (times[index] - start) / range * 600 : 380;
    const y = value => 260 - value / max * 220;
    const label = mode === "exercise" ? exercises.find(exercise => String(exercise.id) === exerciseId)?.name : data.days.find(day => String(day.id) === dayId)?.name;

    return <section className="volume-trend-panel" aria-labelledby="volume-heading">
        <div className="section-heading"><h2 id="volume-heading">{isExercise ? "Estimated one-rep max progress" : "Volume progress"}</h2><span className="muted">{isExercise ? "Estimated 1RM per set" : "Weight × reps per session"}</span></div>
        {data.days.length === 0 ? <div className="empty-state"><h3>Your progress starts with a session.</h3><p>Log workout sets to see your progress.</p></div> : <>
            <div className="trend-filters">
                <label>Trend<select value={mode} onChange={event => { setMode(event.target.value); setSelectedPoint(null); }}><option value="day">Split day volume</option><option value="exercise">Exercise estimated 1RM</option></select></label>
                <label>Training day<select value={dayId} onChange={event => { setSelectedDay(event.target.value); setSelectedExercise(""); setSelectedPoint(null); }}>{data.days.map(day => <option value={day.id} key={day.id}>{day.split_name} · {day.name}</option>)}</select></label>
                {mode === "exercise" && <label>Exercise<select value={exerciseId} onChange={event => { setSelectedExercise(event.target.value); setSelectedPoint(null); }}>{exercises.map(exercise => <option value={exercise.id} key={exercise.id}>{exercise.name}</option>)}</select></label>}
            </div>
            {points.length === 0 ? <p className="empty-state">No recorded sets for this selection.</p> : <>
                <div className="trend-readout" aria-live="polite"><h3>{label}</h3><p><strong>{formatValue(active.volume)} lb</strong><span className="muted"> · {pointDescription(active)}</span></p></div>
                <div className="volume-chart"><svg viewBox="0 0 740 320" role="img" aria-label={`${label} ${metric} across ${points.length} ${isExercise ? "sets" : "sessions"}, in pounds`}>
                    {[0, 1, 2, 3, 4].map(tick => { const value = max * tick / 4; return <g key={tick}><line x1="80" x2="680" y1={y(value)} y2={y(value)} className="chart-grid"/><text x="68" y={y(value) + 4} textAnchor="end">{Math.round(value).toLocaleString()}</text></g>; })}
                    <text x="80" y="22">{metric} (lb)</text>
                    <polyline points={points.map((point, index) => `${x(index)},${y(point.volume)}`).join(" ")} className="chart-line"/>
                    {points.map((point, index) => <circle key={point.id} cx={x(index)} cy={y(point.volume)} r={point.id === active.id ? 7 : 5} className="chart-point"><title>{pointDescription(point)}: {formatValue(point.volume)} lb</title></circle>)}
                    <text x="80" y="294">{formatDate(points[0].date)}</text><text x="680" y="294" textAnchor="end">{points.length > 1 ? formatDate(points.at(-1).date) : ""}</text>
                </svg></div>
                <label className="trend-session-picker">Inspect {isExercise ? "a set" : "a session"}<select value={active.id} onChange={event => setSelectedPoint(event.target.value)}>{points.map((point, index) => <option key={point.id} value={point.id}>{isExercise ? "Entry" : "Session"} {index + 1} · {pointDescription(point)} · {formatValue(point.volume)} lb</option>)}</select></label>
                <p className="muted trend-note">{points.length === 1 ? "Log another session to see a trend. " : ""}{isExercise ? "Each point estimates one set’s 1RM using Epley: weight × (1 + reps / 30). Single-rep sets use the lifted weight. Skipped sets are omitted." : "Only sessions with recorded sets are shown."}</p>
                <details className="trend-data"><summary>View chart data</summary><ul>{points.map(point => <li key={point.id}><span>{pointDescription(point)}</span><strong>{formatValue(point.volume)} lb</strong></li>)}</ul></details>
            </>}
        </>}
    </section>;
}
