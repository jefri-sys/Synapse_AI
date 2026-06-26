import React, { useState, useEffect } from "react";
import ProtectedPage from "../../components/ProtectedPage.jsx";
import api from "../../services/api";
import {
 Plus,
 Flame,
 Award,
 CalendarDays,
 CheckCircle2,
 Circle,
} from "lucide-react";
import { Button } from "../../components/ui/button.jsx";
import { Card } from "../../components/ui/card.jsx";
import { Input } from "../../components/ui/input.jsx";

export default function HabitTracker() {
 const [analytics, setAnalytics] = useState([]);
 const [showModal, setShowModal] = useState(false);
 const [newHabitName, setNewHabitName] = useState("");

 // To draw the github contribution grid, we need logs.
 // We'll fetch raw habits and we'll just check today's status locally for the toggle
 // Since we only get 'analytics', let's also fetch a local view of recent completions if possible, or just build the check-in based on current checkin state. Wait, the API doesn't return the raw logs matrix. Let's just track "todayCheckedIn" via the streak or a separate check?
 // Let's add a "checkedInToday" flag to analytics backend... Ah I can't easily change it now, I'll just check if currentStreak > 0 AND it's checked in. Let's just do a basic toggle.

 useEffect(() => {
 fetchAnalytics();
 }, []);

 const fetchAnalytics = async () => {
 try {
 const res = await api.get("/habits/analytics");
 setAnalytics(res.data.analytics);
 } catch (err) {
 console.error(err);
 }
 };

 const addHabit = async (e) => {
 e.preventDefault();
 if (!newHabitName.trim()) return;
 try {
 await api.post("/habits", { name: newHabitName });
 setNewHabitName("");
 setShowModal(false);
 fetchAnalytics();
 } catch (err) {
 alert(err.response?.data?.message || "Failed to add habit");
 }
 };

 const toggleCheckin = async (habitId) => {
 const habit = analytics.find((h) => h.habitId === habitId);
 if (!habit || !habit.last7Days) return;

 const todayLog = habit.last7Days[habit.last7Days.length - 1];
 const newStatus = !todayLog.completed;

 try {
 await api.patch("/habits/checkin", {
 habitId,
 date: todayLog.date,
 completed: newStatus,
 });
 fetchAnalytics();
 } catch (err) {
 console.error(err);
 }
 };

 const deleteHabit = async (id) => {
 if (!window.confirm("Delete this habit entirely?")) return;
 try {
 await api.delete(`/habits/${id}`);
 fetchAnalytics();
 } catch (err) {
 console.error(err);
 }
 };

 return (
 <ProtectedPage
 title="Habits Tracker"
 description="Build good routines and track your daily streaks."
 headerAction={
 <Button
 onClick={() => setShowModal(true)}
 disabled={analytics.length >= 6}
 variant="primary"
 className="flex items-center gap-2 shadow-sm"
 >
 <Plus className="w-4 h-4" /> Add Habit
 </Button>
 }
 >

 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
 {analytics.map((habit) => (
 <Card
 key={habit.habitId}
 className="p-5 flex flex-col relative group"
 >
 <button
 onClick={() => deleteHabit(habit.habitId)}
 className="absolute top-4 right-4 text-text-tertiary hover:text-status-danger opacity-0 group-hover:opacity-100 transition-opacity"
 >
 &times;
 </button>
 <div className="flex justify-between items-start mb-4">
 <h3 className="font-semibold text-lg font-display text-text-primary">{habit.name}</h3>
 <button
 onClick={() => toggleCheckin(habit.habitId)}
 className="text-brand-primary hover:text-brand-primary-hover transition-colors mt-0.5"
 >
 {habit.last7Days &&
 habit.last7Days[habit.last7Days.length - 1].completed ? (
 <CheckCircle2 className="w-6 h-6 text-status-success" />
 ) : (
 <Circle className="w-6 h-6 text-text-tertiary" />
 )}
 </button>
 </div>

 {/* GitHub Contribution Grid (7 Days) */}
 <div className="mb-4 flex items-center gap-2 justify-center">
 {habit.last7Days &&
 habit.last7Days.map((day, idx) => {
 const isToday = idx === habit.last7Days.length - 1;
 return (
 <div
 key={day.date}
 title={day.date}
 className={`w-8 h-8 rounded-md flex items-center justify-center text-[10px] font-bold transition-all ${
 day.isFuture
 ? "bg-surface-border text-text-tertiary"
 : day.completed
 ? "bg-status-success text-white shadow-sm"
 : "bg-surface-sunken text-text-secondary"
 } ${isToday ? "ring-2 ring-brand-primary ring-offset-2 ring-offset-surface-base" : ""}`}
 >
 {
 ["S", "M", "T", "W", "T", "F", "S"][
 new Date(day.date).getDay()
 ]
 }
 </div>
 );
 })}
 </div>

 <div className="grid grid-cols-2 gap-4 mb-4">
 <div className="bg-surface-sunken p-3 rounded-md border border-surface-border flex flex-col items-center">
 <Flame className="w-5 h-5 text-status-warning mb-1" />
 <span className="text-xl font-display font-semibold text-text-primary">
 {habit.currentStreak}
 </span>
 <span className="text-[10px] font-semibold text-text-secondary uppercase tracking-wide">
 Current Streak
 </span>
 </div>
 <div className="bg-surface-sunken p-3 rounded-md border border-surface-border flex flex-col items-center">
 <Award className="w-5 h-5 text-brand-primary mb-1" />
 <span className="text-xl font-display font-semibold text-text-primary">
 {habit.bestStreak}
 </span>
 <span className="text-[10px] font-semibold text-text-secondary uppercase tracking-wide">
 Best Streak
 </span>
 </div>
 </div>

 <div className="mt-auto">
 <div className="flex justify-between text-sm mb-2">
 <span className="text-text-secondary font-medium text-xs">
 Monthly Completion
 </span>
 <span className="font-semibold text-brand-primary text-xs">
 {habit.monthlyCompletion}%
 </span>
 </div>
 <div className="w-full bg-surface-sunken rounded-sm h-1.5 overflow-hidden">
 <div
 className="bg-brand-primary h-full rounded-sm"
 style={{ width: `${habit.monthlyCompletion}%` }}
 ></div>
 </div>
 </div>
 </Card>
 ))}
 {analytics.length === 0 && (
 <div className="col-span-full py-12 text-center text-text-secondary font-medium bg-surface-base rounded-md border border-surface-border border-dashed">
 No habits created yet. Click "Add Habit" to get started!
 </div>
 )}
 </div>

 {showModal && (
 <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
 <Card className="p-6 w-full max-w-sm shadow-xl">
 <h3 className="font-semibold text-lg mb-4 text-text-primary font-display">
 Create New Habit
 </h3>
 <form onSubmit={addHabit}>
 <Input
 type="text"
 value={newHabitName}
 onChange={(e) => setNewHabitName(e.target.value)}
 placeholder="e.g. Read 10 pages, Meditate"
 className="mb-6"
 autoFocus
 />
 <div className="flex gap-3">
 <Button
 type="button"
 variant="secondary"
 onClick={() => setShowModal(false)}
 className="flex-1"
 >
 Cancel
 </Button>
 <Button
 type="submit"
 variant="primary"
 disabled={!newHabitName.trim()}
 className="flex-1"
 >
 Save Habit
 </Button>
 </div>
 </form>
 </Card>
 </div>
 )}
 </ProtectedPage>
 );
}
