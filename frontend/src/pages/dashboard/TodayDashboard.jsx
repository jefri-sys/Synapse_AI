import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import ProtectedPage from "../../components/ProtectedPage.jsx";
import api from "../../services/api";
import { useAuth } from "../../hooks/useAuth.js";
import { io } from "socket.io-client";
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Circle,
} from "lucide-react";
import { StatCard } from '../../components/ui/stat-card.jsx';
import { AIAccent } from '../../components/ui/ai-accent.jsx';
import { Card } from '../../components/ui/card.jsx';
import { Badge } from '../../components/ui/badge.jsx';
import NotificationBell from '../../components/NotificationBell.jsx';

function TodayDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState({
    briefing: null,
    todayTasks: [],
    cgpa: null,
    budget: null,
    habitAnalytics: null,
    notifications: [],
    upcomingDeadlines: [],
  });
  const [loading, setLoading] = useState(true);
  const [briefingLoading, setBriefingLoading] = useState(true);
  const [briefingLimitHit, setBriefingLimitHit] = useState(false);

  // Time of day greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        api
          .get("/ai/briefing")
          .then((res) => {
            if (res.data.success) {
              setData((prev) => ({ ...prev, briefing: res.data.content }));
            } else {
              setBriefingLimitHit(res.data.limitHit || false);
            }
            setBriefingLoading(false);
          })
          .catch((err) => {
            console.error(err);
            if (err.response?.status === 429 || err.response?.data?.limitHit) {
              setBriefingLimitHit(true);
            }
            setBriefingLoading(false);
          });

        const semestersRes = await api.get("/semesters");
        let activeSemId = null;
        if (semestersRes.data?.success) {
          const workingSemId = localStorage.getItem(
            "synapse_working_semester_id",
          );
          if (workingSemId) {
            const workingSem = semestersRes.data.semesters.find(
              (s) => s._id === workingSemId,
            );
            if (workingSem) activeSemId = workingSem._id;
          }
          if (!activeSemId) {
            const active = semestersRes.data.semesters.find((s) => s.isActive);
            if (active) activeSemId = active._id;
          }
        }

        const [
          tasksRes,
          cgpaRes,
          expensesRes,
          habitsRes,
          notifRes,
          allTasksRes,
          examsRes,
        ] = await Promise.allSettled([
          api.get("/tasks/today"),
          api.get("/academics/cgpa"),
          api.get("/expenses/summary"),
          api.get("/habits/analytics"),
          api.get("/notifications?limit=3"),
          api.get("/tasks"),
          activeSemId
            ? api.get(`/semesters/${activeSemId}/exams`)
            : Promise.resolve({ data: { success: true, exams: [] } }),
        ]);

        const todayTasks =
          tasksRes.status === "fulfilled" && tasksRes.value?.data?.success
            ? tasksRes.value.data.tasks
            : [];
        const cgpa =
          cgpaRes.status === "fulfilled" && cgpaRes.value?.data?.success
            ? cgpaRes.value.data.cgpa
            : null;
        const budget =
          expensesRes.status === "fulfilled" && expensesRes.value?.data?.success
            ? expensesRes.value.data.summary.remaining
            : 0;
        const habitAnalytics =
          habitsRes.status === "fulfilled" && habitsRes.value?.data?.success
            ? habitsRes.value.data.analytics
            : null;
        const notifications =
          notifRes.status === "fulfilled" && notifRes.value?.data?.success
            ? notifRes.value.data.notifications
            : [];

        const allTasks =
          allTasksRes.status === "fulfilled" && allTasksRes.value?.data?.success
            ? allTasksRes.value.data.tasks
            : [];
        const exams =
          examsRes.status === "fulfilled" && examsRes.value?.data?.success
            ? examsRes.value.data.exams
            : [];

        const now = new Date();
        const startOfToday = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
        );
        const next7Days = new Date(startOfToday);
        next7Days.setDate(startOfToday.getDate() + 7);

        const upcoming = [];

        allTasks.forEach((t) => {
          if (t.dueDate) {
            const d = new Date(t.dueDate);
            const taskDate = new Date(
              d.getFullYear(),
              d.getMonth(),
              d.getDate(),
            );
            if (
              taskDate >= startOfToday &&
              taskDate <= next7Days &&
              t.status !== "Completed"
            ) {
              upcoming.push({
                type: "task",
                title: t.title,
                date: taskDate,
                id: t._id,
              });
            }
          }
        });

        exams.forEach((e) => {
          if (e.date) {
            const d = new Date(e.date);
            const examDate = new Date(
              d.getFullYear(),
              d.getMonth(),
              d.getDate(),
            );
            if (examDate >= startOfToday && examDate <= next7Days) {
              const subjectName =
                e.subjectId?.name || e.subjectName || "Subject";
              upcoming.push({
                type: "exam",
                title: `${subjectName} Exam`,
                date: examDate,
                id: e._id,
              });
            }
          }
        });

        upcoming.sort((a, b) => a.date - b.date);

        setData((prev) => ({
          ...prev,
          todayTasks,
          cgpa,
          budget,
          habitAnalytics,
          notifications,
          upcomingDeadlines: upcoming,
        }));
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const toggleTaskStatus = async (taskId, currentStatus) => {
    try {
      const newStatus = currentStatus === "Completed" ? "Pending" : "Completed";
      const res = await api.patch(`/tasks/${taskId}/status`, {
        status: newStatus,
      });
      if (res.data.success) {
        setData((prev) => ({
          ...prev,
          todayTasks: prev.todayTasks.map((t) =>
            t._id === taskId ? { ...t, status: newStatus } : t,
          ),
        }));
      }
    } catch (err) {
      console.error("Failed to toggle task:", err);
    }
  };

  const getNearestExamDays = () => {
    const exam = data.upcomingDeadlines.find((d) => d.type === "exam");
    if (exam) {
      const diffTime = Math.abs(exam.date - new Date());
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
    return "-";
  };

  const unreadCount = data.notifications.filter((n) => !n.read).length;

  return (
    <ProtectedPage>
      <div className="flex items-start justify-between mb-8 pb-4 border-b border-surface-border/50">
        <div>
          <h1 className="text-3xl font-bold text-text-primary font-display flex items-center gap-2 tracking-tight">
            {getGreeting()}, {user?.name?.split(' ')[0] || 'Student'} <span className="inline-block animate-wave origin-bottom-right">👋</span>
          </h1>
        </div>
        <div className="flex-shrink-0 bg-surface-raised rounded-full border border-surface-border shadow-sm p-0.5">
          <NotificationBell />
        </div>
      </div>
      <div className="flex flex-col gap-5 mt-2">
        <AIAccent label={briefingLimitHit ? "Daily Focus" : "AI Morning Briefing"}>
          {briefingLoading ? (
            <div className="animate-pulse flex flex-col gap-2">
              <div className="h-4 bg-surface-sunken rounded w-3/4"></div>
              <div className="h-4 bg-surface-sunken rounded w-full"></div>
              <div className="h-4 bg-surface-sunken rounded w-5/6"></div>
            </div>
          ) : briefingLimitHit ? (
            <p className="leading-relaxed">
              Good morning! Check your tasks and deadlines below for today's focus. 
              <span className="block mt-1 text-text-tertiary">(AI features will resume tomorrow)</span>
            </p>
          ) : (
            <p className="leading-relaxed">
              {data.briefing || "Your briefing is unavailable right now."}
            </p>
          )}
        </AIAccent>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          <StatCard label="Current CGPA" value={data.cgpa !== null ? data.cgpa : '--'} />
          <StatCard label="Budget" value={`₹${data.budget !== null ? data.budget : '--'}`} trend="Remaining this month" />
          <StatCard label="Habit Streak" value={data.habitAnalytics?.bestStreak || 0} trend="Days best" />
          <StatCard label="Next Exam" value={getNearestExamDays()} trend="Days away" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2">
            <Card className="flex flex-col gap-4">
              <div className="flex justify-between items-center mb-1">
                <h3 className="font-semibold text-text-primary font-display">Today's Tasks</h3>
                <Link to="/planner" className="text-sm font-medium text-brand-primary hover:text-brand-primary-hover flex items-center gap-1 transition-colors">
                  View All <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              
              {loading ? (
                <div className="animate-pulse space-y-3">
                  <div className="h-10 bg-surface-sunken rounded w-full"></div>
                  <div className="h-10 bg-surface-sunken rounded w-full"></div>
                </div>
              ) : data.todayTasks.length > 0 ? (
                <div className="flex flex-col gap-5">
                  {(() => {
                    const manualTasks = data.todayTasks.filter(t => t.source !== 'ai_planner' && t.source !== 'custom_pdf_plan');
                    const aiTasks = data.todayTasks.filter(t => t.source === 'ai_planner' || t.source === 'custom_pdf_plan');
                    
                    const renderTask = (task) => (
                      <div key={task._id} className="flex items-center gap-3 p-3 rounded-md border border-surface-border hover:bg-surface-sunken transition-colors">
                        <button onClick={() => toggleTaskStatus(task._id, task.status)} className="flex-shrink-0">
                          {task.status === 'Completed' ? (
                            <CheckCircle2 className="w-5 h-5 text-status-success" />
                          ) : (
                            <Circle className="w-5 h-5 text-text-tertiary hover:text-brand-primary transition-colors" />
                          )}
                        </button>
                        <div className="flex flex-col">
                          <span className={`text-sm font-medium ${task.status === 'Completed' ? 'line-through text-text-tertiary' : 'text-text-primary'}`}>
                            {task.title}
                          </span>
                        </div>
                      </div>
                    );

                    return (
                      <>
                        {aiTasks.length > 0 && (
                          <div className="flex flex-col gap-2">
                            <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5" /> AI Study Plan
                            </h4>
                            <div className="flex flex-col gap-2">
                              {aiTasks.map(renderTask)}
                            </div>
                          </div>
                        )}

                        {manualTasks.length > 0 && (
                          <div className="flex flex-col gap-2">
                            <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
                               Manual Tasks
                            </h4>
                            <div className="flex flex-col gap-2">
                              {manualTasks.map(renderTask)}
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              ) : (
                <p className="text-sm text-text-secondary py-4 text-center">No tasks scheduled for today. Enjoy your break!</p>
              )}
            </Card>
          </div>

          <div className="flex flex-col gap-5">
            <Card className="flex flex-col gap-4">
              <h3 className="font-semibold text-text-primary font-display">Upcoming Deadlines</h3>
              {loading ? (
                <div className="animate-pulse space-y-3">
                  <div className="h-8 bg-surface-sunken rounded w-full"></div>
                  <div className="h-8 bg-surface-sunken rounded w-full"></div>
                </div>
              ) : data.upcomingDeadlines.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {data.upcomingDeadlines.slice(0, 5).map((deadline, idx) => (
                    <div key={idx} className="flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-text-primary line-clamp-1">{deadline.title}</span>
                        <Badge status={deadline.type === 'exam' ? 'danger' : 'warning'}>
                          {deadline.type === 'exam' ? 'EXAM' : 'TASK'}
                        </Badge>
                      </div>
                      <span className="text-xs text-text-secondary">
                        {deadline.date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-text-secondary py-2 text-center">No deadlines in the next 7 days.</p>
              )}
            </Card>
          </div>
        </div>
      </div>
    </ProtectedPage>
  );
}

export default TodayDashboard;
