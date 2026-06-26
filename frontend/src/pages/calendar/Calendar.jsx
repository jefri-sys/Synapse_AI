import React, { useState, useEffect } from "react";
import { Calendar as BigCalendar, dateFnsLocalizer } from "react-big-calendar";
import {
  format,
  parse,
  startOfWeek,
  getDay,
  addDays,
  isSameDay,
} from "date-fns";
import "react-big-calendar/lib/css/react-big-calendar.css";
import ProtectedPage from "../../components/ProtectedPage.jsx";
import api from "../../services/api";
import { Plus, X, Trash, BookOpen, Clock, Gift, GraduationCap, User, AlertCircle, FileText } from "lucide-react";
import { Button } from "../../components/ui/button.jsx";
import { Card } from "../../components/ui/card.jsx";
import { Input } from "../../components/ui/input.jsx";

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales: {},
});

const CustomToolbar = ({ label, onNavigate, onView, view }) => (
  <div className="flex items-center justify-between mb-4">
    <div className="flex items-center gap-2">
      <Button variant="ghost" size="sm" onClick={() => onNavigate("PREV")}>
        &larr;
      </Button>
      <span className="font-semibold text-lg min-w-[150px] text-center font-display text-text-primary">
        {label}
      </span>
      <Button variant="ghost" size="sm" onClick={() => onNavigate("NEXT")}>
        &rarr;
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onNavigate("TODAY")}
        className="ml-2"
      >
        Today
      </Button>
    </div>
    <div className="flex gap-1 bg-surface-sunken p-1 rounded-md mr-10">
      <button
        onClick={() => onView("month")}
        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${view === "month" ? "bg-surface-base shadow-sm text-text-primary" : "text-text-secondary hover:bg-surface-hover"}`}
      >
        Month
      </button>
      <button
        onClick={() => onView("week")}
        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${view === "week" ? "bg-surface-base shadow-sm text-text-primary" : "text-text-secondary hover:bg-surface-hover"}`}
      >
        Week
      </button>
    </div>
  </div>
);

const getEventStyles = (category) => {
  const styles = {
    exam: { bg: 'bg-status-danger/10 dark:bg-status-danger/20', text: 'text-status-danger', border: 'border-status-danger/30', icon: FileText, label: 'Exam' },
    deadline: { bg: 'bg-status-warning/10 dark:bg-status-warning/20', text: 'text-status-warning', border: 'border-status-warning/30', icon: Clock, label: 'Deadline' },
    study: { bg: 'bg-brand-primary/10 dark:bg-brand-primary/20', text: 'text-brand-primary', border: 'border-brand-primary/30', icon: BookOpen, label: 'Study Task' },
    birthday: { bg: 'bg-status-info/10 dark:bg-status-info/20', text: 'text-status-info', border: 'border-status-info/30', icon: Gift, label: 'Birthday' },
    college: { bg: 'bg-status-success/10 dark:bg-status-success/20', text: 'text-status-success', border: 'border-status-success/30', icon: GraduationCap, label: 'College Event' },
    personal: { bg: 'bg-text-tertiary/10 dark:bg-text-tertiary/20', text: 'text-text-secondary', border: 'border-text-tertiary/30', icon: User, label: 'Personal' },
    default: { bg: 'bg-surface-sunken', text: 'text-text-secondary', border: 'border-surface-border', icon: AlertCircle, label: 'Other' }
  };
  return styles[category] || styles.default;
};

const eventPropGetter = (event) => {
  return {
    className: "!bg-transparent !p-0 !border-none !shadow-none",
    style: { backgroundColor: "transparent" },
  };
};

const CustomEvent = ({ event }) => {
  const { category } = event.resource;
  const style = getEventStyles(category);
  const Icon = style.icon;
  
  return (
    <div 
      className={`flex items-center gap-1.5 px-1.5 py-1 mx-0.5 mt-[2px] rounded-md ${style.bg} border-l-[3px] ${style.border} ${style.text} hover:opacity-80 transition-all cursor-pointer overflow-hidden backdrop-blur-sm group`}
      title={event.title}
    >
      <Icon className="w-3 h-3 flex-shrink-0 opacity-80 group-hover:opacity-100" />
      <span className="text-[10.5px] font-semibold tracking-wide truncate leading-none mt-[0.5px]">{event.title}</span>
    </div>
  );
};

const dayPropGetter = (date) => {
  if (isSameDay(date, new Date())) {
    return {
      className: "bg-brand-primary/5 dark:bg-brand-primary/10",
    };
  }
  return {};
};

function Calendar() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [view, setView] = useState("month");
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const [date, setDate] = useState(new Date());

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await api.get("/calendar/events");
      if (res.data.success) {
        setEvents(res.data.events);
        setError(false);
      }
    } catch (err) {
      console.error("Failed to load events", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const mappedEvents = events.map((event) => ({
    id: event.id,
    title: event.title,
    start: new Date(event.date),
    end: new Date(event.date),
    allDay: true,
    resource: event,
  }));

  const getNext7DaysEvents = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);

    return events
      .filter((e) => {
        const d = new Date(e.date);
        d.setHours(0, 0, 0, 0);
        return d >= today && d <= nextWeek;
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  const upcomingEvents = getNext7DaysEvents();

  // Group by date
  const groupedUpcoming = upcomingEvents.reduce((acc, ev) => {
    const dStr = new Date(ev.date).toDateString();
    if (!acc[dStr]) acc[dStr] = [];
    acc[dStr].push(ev);
    return acc;
  }, {});

  const handleEventClick = (event) => {
    setSelectedEvent(event.resource);
  };

  const handleDeleteCustom = async (id) => {
    try {
      const actualId = id.replace("custom-", "");
      await api.delete(`/calendar/events/${actualId}`);
      setSelectedEvent(null);
      fetchEvents();
    } catch (err) {
      console.error("Failed to delete event", err);
    }
  };

  const calculateDaysAway = (targetDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(targetDate);
    target.setHours(0, 0, 0, 0);
    const diffTime = target - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays === -1) return "Yesterday";
    if (diffDays < 0) return `${Math.abs(diffDays)} days ago`;
    return `${diffDays} days away`;
  };

  const getSourceLabel = (source) => {
    if (source === "academic") return "From Academic Tracker";
    if (source === "planner") return "From Study Planner";
    return "Custom Event";
  };

  return (
    <ProtectedPage>
      <div className={`flex flex-col lg:flex-row gap-6 transition-all duration-300 h-[calc(100vh-3rem)] sm:h-[calc(100vh-4rem)]`}>
        {/* Left Sidebar */}
        {!isExpanded && (
          <div className="w-full lg:w-72 flex flex-col gap-6 flex-shrink-0 animate-in fade-in slide-in-from-left-4 duration-300">
            <Button
              variant="primary"
              onClick={() => setShowAddModal(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 shadow-sm"
            >
              <Plus className="w-4 h-4" /> Add Event
            </Button>

            <Card className="p-4 flex-1 overflow-y-auto shadow-sm">
              <h3 className="font-semibold text-text-primary font-display mb-4">Next 7 Days</h3>

              {upcomingEvents.length === 0 ? (
                <p className="text-sm text-text-secondary italic">
                  Nothing coming up in the next 7 days
                </p>
              ) : (
                <div className="space-y-4">
                  {Object.entries(groupedUpcoming).map(([dateStr, evs]) => (
                    <div key={dateStr}>
                      <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                        {isSameDay(new Date(dateStr), new Date())
                          ? "Today"
                          : format(new Date(dateStr), "EEEE, MMM d")}
                      </h4>
                      <div className="space-y-2">
                        {evs.map((ev) => {
                          const style = getEventStyles(ev.category);
                          const Icon = style.icon;
                          return (
                            <div
                              key={ev.id}
                              onClick={() => setSelectedEvent(ev)}
                              className="flex items-start gap-3 cursor-pointer hover:bg-surface-sunken p-2 -mx-2 rounded-lg transition-colors group"
                            >
                              <div className={`mt-0.5 p-1.5 rounded-md ${style.bg} ${style.text} ${style.border} border group-hover:scale-105 transition-transform`}>
                                <Icon className="w-3.5 h-3.5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[11px] font-semibold text-text-tertiary mb-0.5 tracking-wider uppercase">
                                  {calculateDaysAway(ev.date)}
                                </p>
                                <p className="text-sm text-text-primary font-medium truncate">
                                  {ev.title}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}

        {/* Main Calendar */}
        <Card className="flex-1 p-5 overflow-hidden flex flex-col shadow-sm relative transition-all duration-300">
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="absolute top-4 right-4 z-20 p-2 bg-surface-sunken hover:bg-surface-hover text-text-secondary hover:text-text-primary rounded-md transition-colors shadow-sm border border-surface-border"
            title={isExpanded ? "Collapse Calendar" : "Expand Calendar"}
          >
            {isExpanded ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
            )}
          </button>
          
          {error ? (
            <div className="flex-1 flex items-center justify-center text-text-secondary">
              Could not load calendar. Please refresh.
            </div>
          ) : loading ? (
            <div className="flex-1 animate-pulse">
              <div className="h-10 bg-surface-sunken rounded w-full mb-4"></div>
              <div className="grid grid-cols-7 gap-2 h-full">
                {Array.from({ length: 35 }).map((_, i) => (
                  <div
                    key={i}
                    className="bg-surface-base rounded-md border border-surface-border"
                  ></div>
                ))}
              </div>
            </div>
          ) : (
            <BigCalendar
              localizer={localizer}
              events={mappedEvents}
              startAccessor="start"
              endAccessor="end"
              style={{ height: "100%" }}
              views={["month", "week"]}
              view={view}
              date={date}
              onNavigate={(d) => setDate(d)}
              onView={(v) => setView(v)}
              components={{
                toolbar: CustomToolbar,
                event: CustomEvent,
              }}
              eventPropGetter={eventPropGetter}
              dayPropGetter={dayPropGetter}
              onSelectEvent={handleEventClick}
              popup
            />
          )}

          {/* Legend */}
          <div className="mt-5 pt-4 border-t border-surface-border flex flex-wrap gap-x-6 gap-y-3 items-center justify-center text-[11px] text-text-secondary font-medium">
            {['exam', 'deadline', 'study', 'birthday', 'college', 'personal'].map(cat => {
              const style = getEventStyles(cat);
              const Icon = style.icon;
              return (
                <span key={cat} className="flex items-center gap-1.5 group cursor-default">
                  <div className={`p-1 rounded ${style.bg} ${style.text} group-hover:scale-110 transition-transform`}>
                    <Icon className="w-3 h-3" />
                  </div>
                  <span className="tracking-wide">{style.label}</span>
                </span>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Add Event Modal */}
      {showAddModal && (
        <AddEventModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            fetchEvents();
          }}
        />
      )}

      {/* Event Detail Modal */}
      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onDelete={() => handleDeleteCustom(selectedEvent.id)}
          daysAway={calculateDaysAway(selectedEvent.date)}
          sourceLabel={getSourceLabel(selectedEvent.source)}
        />
      )}
    </ProtectedPage>
  );
}

const CalendarIcon = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="16" y1="2" x2="16" y2="6"></line>
    <line x1="8" y1="2" x2="8" y2="6"></line>
    <line x1="3" y1="10" x2="21" y2="10"></line>
  </svg>
);

const AddEventModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: "",
    date: format(new Date(), "yyyy-MM-dd"),
    category: "personal",
    priority: "medium",
    reminderDays: 1,
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.date) {
      setError("Title and date are required");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      const res = await api.post("/calendar/events", formData);
      if (res.data.success) {
        onSuccess();
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add event");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="p-0 bg-surface-base w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-surface-border">
          <h2 className="text-lg font-bold text-text-primary font-display">Add Custom Event</h2>
          <button
            onClick={onClose}
            className="text-text-tertiary hover:text-text-primary transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="p-3 bg-status-danger/10 text-status-danger text-sm rounded-md border border-status-danger/20">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Title <span className="text-status-danger">*</span>
            </label>
            <Input
              type="text"
              placeholder="E.g. College Fest"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Date <span className="text-status-danger">*</span>
            </label>
            <Input
              type="date"
              value={formData.date}
              onChange={(e) =>
                setFormData({ ...formData, date: e.target.value })
              }
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Category
              </label>
              <select
                className="w-full border border-surface-border rounded-md bg-surface-base p-2 focus:ring-2 focus:ring-brand-primary outline-none text-text-primary text-sm"
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
              >
                <option value="birthday">Birthday</option>
                <option value="college">College Event</option>
                <option value="personal">Personal</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Priority
              </label>
              <select
                className="w-full border border-surface-border rounded-md bg-surface-base p-2 focus:ring-2 focus:ring-brand-primary outline-none text-text-primary text-sm"
                value={formData.priority}
                onChange={(e) =>
                  setFormData({ ...formData, priority: e.target.value })
                }
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Reminder
            </label>
            <select
              className="w-full border border-surface-border rounded-md bg-surface-base p-2 focus:ring-2 focus:ring-brand-primary outline-none text-text-primary text-sm"
              value={formData.reminderDays}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  reminderDays: parseInt(e.target.value),
                })
              }
            >
              <option value={0}>Same day</option>
              <option value={1}>1 day before</option>
              <option value={2}>2 days before</option>
              <option value={3}>3 days before</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Notes (Optional)
            </label>
            <textarea
              className="w-full border border-surface-border rounded-md bg-surface-base p-2 focus:ring-2 focus:ring-brand-primary outline-none resize-none text-text-primary text-sm"
              rows="3"
              placeholder="Any extra details..."
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
            />
          </div>

          <div className="pt-4 border-t border-surface-border flex justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={submitting}
            >
              {submitting ? "Adding..." : "Add Event"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

const EventDetailModal = ({
  event,
  onClose,
  onDelete,
  daysAway,
  sourceLabel,
}) => {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="p-0 bg-surface-base w-full max-w-sm overflow-hidden">
        <div className="flex items-start justify-between p-4 border-b border-surface-border">
          <div>
            <div
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold mb-2 uppercase tracking-wider ${getEventStyles(event.category).bg} ${getEventStyles(event.category).text} border ${getEventStyles(event.category).border}`}
            >
              {(() => {
                const Icon = getEventStyles(event.category).icon;
                return <Icon className="w-3 h-3" />;
              })()}
              {getEventStyles(event.category).label}
            </div>
            <h2 className="text-xl font-bold font-display text-text-primary leading-tight pr-4">
              {event.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-text-tertiary hover:text-text-primary transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <p className="uppercase tracking-wider font-semibold text-[10px] text-text-tertiary mb-1">
              Date
            </p>
            <p className="text-text-primary font-medium text-sm">
              {format(new Date(event.date), "EEEE, d MMMM yyyy")}
            </p>
            <p className="text-brand-primary font-medium text-sm mt-0.5">
              {daysAway}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="uppercase tracking-wider font-semibold text-[10px] text-text-tertiary mb-1">
                Priority
              </p>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold capitalize
                ${
                  event.priority === "high"
                    ? "bg-status-danger/10 text-status-danger"
                    : event.priority === "medium"
                      ? "bg-status-warning/10 text-status-warning"
                      : "bg-status-success/10 text-status-success"
                }`}
              >
                {event.priority || "Medium"}
              </span>
            </div>
            {event.reminderDays !== undefined && (
              <div>
                <p className="uppercase tracking-wider font-semibold text-[10px] text-text-tertiary mb-1">
                  Reminder
                </p>
                <p className="text-sm font-medium text-text-primary">
                  {event.reminderDays === 0
                    ? "Same day"
                    : `${event.reminderDays} days before`}
                </p>
              </div>
            )}
          </div>

          {event.notes && (
            <div>
              <p className="uppercase tracking-wider font-semibold text-[10px] text-text-tertiary mb-1">
                Notes
              </p>
              <p className="text-sm text-text-secondary bg-surface-sunken p-2.5 rounded-md border border-surface-border whitespace-pre-wrap">
                {event.notes}
              </p>
            </div>
          )}

          <div className="pt-2">
            <p className="text-xs text-text-tertiary font-medium italic">
              {sourceLabel}
            </p>
          </div>
        </div>

        {event.source === "custom" && (
          <div className="bg-surface-sunken p-4 border-t border-surface-border flex justify-end">
            <Button
              variant="danger"
              onClick={() => {
                if (
                  window.confirm("Are you sure you want to delete this event?")
                ) {
                  onDelete();
                }
              }}
            >
              <Trash className="w-4 h-4 mr-1.5" /> Delete Event
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Calendar;
