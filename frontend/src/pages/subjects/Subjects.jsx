import { useState, useEffect } from "react";
import ProtectedPage from "../../components/ProtectedPage.jsx";
import api from "../../services/api";
import { useAuth } from "../../hooks/useAuth.js";
import SubjectDrawer from "../../components/subjects/SubjectDrawer.jsx";
import { StickyNote, Trash2 } from "lucide-react";
import { Button } from "../../components/ui/button.jsx";
import { Card } from "../../components/ui/card.jsx";
import { Badge } from "../../components/ui/badge.jsx";

function Subjects() {
 const { user } = useAuth();
 const [allSubjects, setAllSubjects] = useState([]);
 const [allSemesters, setAllSemesters] = useState([]);
 const [selectedSemId, setSelectedSemId] = useState("current");
 const [loading, setLoading] = useState(true);
 const [selectedSubject, setSelectedSubject] = useState(null);
 const [drawerOpen, setDrawerOpen] = useState(false);
 const [scratchpadNotes, setScratchpadNotes] = useState([]);
 const [activeSemester, setActiveSemester] = useState(null);
 const [workingSemId, setWorkingSemId] = useState(
 localStorage.getItem("synapse_working_semester_id") || null,
 );

 const handleSetWorkingSemester = (semId) => {
 if (semId) {
 localStorage.setItem("synapse_working_semester_id", semId);
 setWorkingSemId(semId);
 } else {
 localStorage.removeItem("synapse_working_semester_id");
 setWorkingSemId(null);
 }
 // Also trigger custom event if other tabs are open
 window.dispatchEvent(new Event("working_semester_changed"));
 };

 useEffect(() => {
 const loadNotes = () => {
 const saved = JSON.parse(localStorage.getItem("synapse_notes") || "[]");
 setScratchpadNotes(saved);
 };
 loadNotes();
 window.addEventListener("synapse_notes_updated", loadNotes);
 return () => window.removeEventListener("synapse_notes_updated", loadNotes);
 }, []);

 const deleteNote = (index) => {
 const newNotes = [...scratchpadNotes];
 newNotes.splice(index, 1);
 localStorage.setItem("synapse_notes", JSON.stringify(newNotes));
 setScratchpadNotes(newNotes);
 window.dispatchEvent(new Event("synapse_notes_updated"));
 };

 useEffect(() => {
 const fetchSubjectsAndSemester = async () => {
 try {
 const semRes = await api.get("/semesters");
 let currentSem = null;
 if (semRes.data.success) {
 setAllSemesters(semRes.data.semesters);
 currentSem = semRes.data.semesters.find((s) => s.isActive);
 setActiveSemester(currentSem);
 }

 const { data } = await api.get("/subjects");
 if (data.success) {
 setAllSubjects(data.subjects);
 }
 } catch (error) {
 console.error("Failed to fetch subjects:", error);
 } finally {
 setLoading(false);
 }
 };

 if (user) {
 fetchSubjectsAndSemester();
 }
 }, [user]);

 const displayedSubjects = allSubjects.filter((sub) => {
 let effectiveSemId = selectedSemId;
 if (effectiveSemId === "current") {
 if (workingSemId) effectiveSemId = workingSemId;
 else if (activeSemester) effectiveSemId = activeSemester._id;
 }

 if (effectiveSemId === "current") {
 return sub.semester === user?.semester; // fallback
 }
 if (effectiveSemId === "all") return true;
 return (
 sub.semesterId === effectiveSemId ||
 String(sub.semester) === String(effectiveSemId)
 );
 });

 return (
    <ProtectedPage>
      <div className="mt-2 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex flex-col">
            <h2 className="text-2xl font-bold text-text-primary font-display tracking-tight">
              Your Subjects
            </h2>
            <p className="text-sm text-text-secondary mt-1">
              Manage your academic workflow and course materials.
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            {selectedSemId !== "all" &&
              selectedSemId !== "current" &&
              selectedSemId !== activeSemester?._id &&
              selectedSemId !== workingSemId && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleSetWorkingSemester(selectedSemId)}
                  className="bg-surface-raised/80 backdrop-blur-md border-surface-border hover:bg-brand-primary/10 hover:border-brand-primary/30 transition-all"
                >
                  Set as Active Context
                </Button>
              )}
            {workingSemId &&
              (selectedSemId === workingSemId ||
                selectedSemId === "current") && (
                <Button
                  variant="outline"
                  tone="warning"
                  size="sm"
                  onClick={() => handleSetWorkingSemester(null)}
                >
                  Clear Context Override
                </Button>
              )}
            <div className="relative">
              <select
                value={selectedSemId}
                onChange={(e) => setSelectedSemId(e.target.value)}
                className="appearance-none flex rounded-xl border border-surface-border bg-surface-base/60 backdrop-blur-xl pl-4 pr-10 py-2 text-sm font-medium text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition-all shadow-sm hover:border-brand-primary/30 cursor-pointer"
              >
                <option value="current" className="bg-surface-base">
                  {workingSemId ? "Working Context" : "Current Semester"} (
                  {workingSemId
                    ? allSemesters.find((s) => s._id === workingSemId)
                        ?.semesterNumber
                    : activeSemester?.semesterNumber || user?.semester || "?"}
                  )
                </option>
                {allSemesters
                  .filter(
                    (s) =>
                      s._id !== activeSemester?._id && s._id !== workingSemId,
                  )
                  .map((sem) => (
                    <option key={sem._id} value={sem._id} className="bg-surface-base">
                      Semester {sem.semesterNumber}
                    </option>
                  ))}
                <option value="all" className="bg-surface-base">All Semesters</option>
              </select>
              <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-text-tertiary">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin"></div>
        </div>
      ) : displayedSubjects.length > 0 ? (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
          {displayedSubjects.map((subject) => (
            <Card
              key={subject._id}
              onClick={() => {
                setSelectedSubject(subject);
                setDrawerOpen(true);
              }}
              className="group relative flex flex-col p-4 cursor-pointer bg-surface-base/60 backdrop-blur-xl border border-surface-border hover:border-brand-primary/40 overflow-hidden transition-all duration-300 hover:shadow-[0_4px_20px_rgba(99,102,241,0.06)] rounded-xl"
            >
              {/* Subtle background glow effect on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              
              <div className="relative z-10 flex flex-col h-full">
                <p className="text-[10px] font-mono font-medium text-brand-primary/80 mb-1.5 uppercase tracking-wider">
                  {subject.code}
                </p>
                <h3 className="text-base font-display font-semibold text-text-primary mb-2 leading-snug group-hover:text-brand-primary transition-colors duration-300 line-clamp-2">
                  {subject.name}
                </h3>
                <div className="mt-auto pt-2 flex items-end justify-between min-h-[28px]">
                  {subject.professor ? (
                    <Badge variant="secondary" className="bg-surface-raised/50 border-surface-border backdrop-blur-md px-2 py-0.5 text-xs font-medium shadow-sm truncate max-w-[80%]">
                      <span className="opacity-70 mr-1 text-[9px] uppercase tracking-wider">Prof.</span> {subject.professor}
                    </Badge>
                  ) : (
                    <div />
                  )}
                  <div className="w-7 h-7 rounded-full bg-brand-primary/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-x-1 ml-auto">
                    <svg className="w-3.5 h-3.5 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-surface-base/30 backdrop-blur-md rounded-2xl border border-surface-border border-dashed">
          <div className="w-16 h-16 rounded-full bg-surface-raised/50 flex items-center justify-center mb-4">
            <StickyNote className="w-8 h-8 text-text-tertiary" />
          </div>
          <h3 className="text-lg font-medium text-text-primary mb-2">No subjects found</h3>
          <p className="text-sm text-text-secondary max-w-sm">
            You don't have any subjects in this context. Add them in the Academics tab to start tracking your coursework.
          </p>
        </div>
      )}

      <div className="mt-12 mb-8">
        <h2 className="mb-6 text-xl font-bold text-text-primary font-display flex items-center gap-3 tracking-tight">
          <div className="p-2 bg-brand-primary/10 rounded-lg">
            <StickyNote className="w-5 h-5 text-brand-primary" />
          </div>
          Quick Scratchpad
        </h2>
        <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {scratchpadNotes.length > 0 ? (
            scratchpadNotes.map((note, index) => (
              <div
                key={index}
                className="group relative bg-surface-base/50 backdrop-blur-xl border border-surface-border rounded-2xl p-5 shadow-sm hover:shadow-lg hover:border-brand-primary/30 transition-all duration-300 flex flex-col"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-primary/40 to-transparent opacity-50 rounded-t-2xl" />
                <button
                  onClick={() => deleteNote(index)}
                  className="absolute top-4 right-4 p-1.5 rounded-full text-text-tertiary hover:text-status-danger hover:bg-status-danger/10 opacity-0 group-hover:opacity-100 transition-all focus:opacity-100"
                  aria-label="Delete note"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <p className="text-sm text-text-primary whitespace-pre-wrap leading-relaxed flex-1 mt-2">
                  {note.text}
                </p>
                <p className="text-[10px] font-mono text-text-tertiary mt-5 uppercase tracking-widest opacity-70">
                  {new Date(note.date).toLocaleString(undefined, { 
                    month: 'short', 
                    day: 'numeric', 
                    hour: 'numeric', 
                    minute: '2-digit' 
                  })}
                </p>
              </div>
            ))
          ) : (
            <div className="col-span-full py-12 px-6 text-center bg-surface-base/30 backdrop-blur-md border border-surface-border border-dashed rounded-2xl">
              <p className="text-sm text-text-secondary font-medium">
                Your scratchpad is empty. Use <span className="text-brand-primary">QuickCapture</span> from the Smart
                Sidebar to jot something down on the fly!
              </p>
            </div>
          )}
        </div>
      </div>

 <SubjectDrawer
 subject={selectedSubject}
 isOpen={drawerOpen}
 onClose={() => setDrawerOpen(false)}
 />
 </ProtectedPage>
 );
}

export default Subjects;
