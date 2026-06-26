import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sun, Moon, GraduationCap, Calendar, Briefcase,
  AlignLeft, MessageCircle, Receipt, FileText,
  Brain, BookOpen, BrainCircuit, ArrowRight, AlertTriangle,
  Users, FileCheck, CheckCircle2, Compass, Sparkles, LogIn,
  Clock, TrendingUp, TrendingDown, PlayCircle, Book
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import { useAuth } from '../../hooks/useAuth';

function TypingIndicator({ duration, children }) {
  const [resolved, setResolved] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setResolved(true), duration * 1000);
    return () => clearTimeout(t);
  }, [duration]);

  if (resolved) return children;

  return (
    <div className="flex gap-1 items-center p-3 rounded-2xl rounded-tr-sm bg-[var(--primary-bg)] w-[60px] h-[40px] justify-center">
      <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 0.8, delay: 0 }} className="w-1.5 h-1.5 rounded-full bg-[var(--primary-color)]" />
      <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 0.8, delay: 0.2 }} className="w-1.5 h-1.5 rounded-full bg-[var(--primary-color)]" />
      <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 0.8, delay: 0.4 }} className="w-1.5 h-1.5 rounded-full bg-[var(--primary-color)]" />
    </div>
  )
}

const BackgroundNeurons = ({ currentScene, totalScenes }) => {
  const finalPositions = [
    { x: 50, y: 15 },
    { x: 35, y: 25 }, { x: 65, y: 25 },
    { x: 20, y: 45 }, { x: 50, y: 40 }, { x: 80, y: 45 },
    { x: 30, y: 65 }, { x: 50, y: 60 }, { x: 70, y: 65 },
    { x: 45, y: 80 }, { x: 55, y: 80 },
    { x: 25, y: 85 }, { x: 75, y: 85 },
    { x: 10, y: 60 }, { x: 90, y: 60 }
  ];

  const progress = currentScene / (totalScenes - 1);

  const getPosition = (i) => {
    const finalPos = finalPositions[i];
    const startX = 10 + ((i * 47) % 80);
    const startY = 10 + ((i * 61) % 80);

    // Wander effect decreases as progress increases
    const wanderX = Math.sin(i * 1.5 + currentScene) * 15 * (1 - progress);
    const wanderY = Math.cos(i * 2.1 - currentScene) * 15 * (1 - progress);

    const x = startX + (finalPos.x - startX) * progress + wanderX;
    const y = startY + (finalPos.y - startY) * progress + wanderY;

    return { x, y };
  };

  const nodes = finalPositions.map((_, i) => getPosition(i));
  const isFinal = currentScene === totalScenes - 1;

  return (
    <div className="absolute top-0 left-0 w-full h-full z-0 pointer-events-none overflow-hidden opacity-40">
      <svg width="100%" height="100%">
        <defs>
          <radialGradient id="glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--primary-color)" stopOpacity="0.8" />
            <stop offset="100%" stopColor="var(--primary-color)" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Lines */}
        {nodes.map((node, i) => {
          return nodes.slice(i + 1).map((node2, j) => {
            const actualJ = i + 1 + j;
            const dist = Math.hypot(node.x - node2.x, node.y - node2.y);
            const connectionThreshold = 35; // % distance

            if (dist > connectionThreshold) return null;

            const lineOpacity = Math.max(0.05, 1 - (dist / connectionThreshold)) * (isFinal ? 0.6 : 0.3);

            return (
              <motion.line
                key={`line-${i}-${actualJ}`}
                animate={{
                  x1: `${node.x}%`, y1: `${node.y}%`,
                  x2: `${node2.x}%`, y2: `${node2.y}%`,
                  opacity: lineOpacity
                }}
                stroke="var(--primary-color)"
                strokeWidth={isFinal && dist < 20 ? "2" : "1"}
                transition={{ duration: 1.5, ease: "easeInOut" }}
              />
            )
          })
        })}

        {/* Nodes */}
        {nodes.map((node, i) => (
          <g key={`node-${i}`}>
            {isFinal && (
              <motion.circle
                animate={{ cx: `${node.x}%`, cy: `${node.y}%` }}
                r="15"
                fill="url(#glow)"
                transition={{ duration: 1.5, ease: "easeInOut" }}
              />
            )}
            <motion.circle
              animate={{ cx: `${node.x}%`, cy: `${node.y}%` }}
              r={isFinal ? "4" : "3"}
              fill="var(--primary-color)"
              transition={{ duration: 1.5, ease: "easeInOut" }}
            />
          </g>
        ))}
      </svg>
    </div>
  );
};

const COURSES = [
  { id: 'BCA',    label: 'BCA',    full: 'Bachelor of Computer Applications', duration: '3 years · 6 semesters' },
  { id: 'MCA',    label: 'MCA',    full: 'Master of Computer Applications',   duration: '2 years · 4 semesters' },
  { id: 'B.Tech', label: 'B.Tech', full: 'Bachelor of Technology',            duration: '4 years · 8 semesters' },
  { id: 'B.Com',  label: 'B.Com',  full: 'Bachelor of Commerce',              duration: '3 years · 6 semesters' },
  { id: 'MBA',    label: 'MBA',    full: 'Master of Business Administration', duration: '2 years · 4 semesters' },
  { id: 'M.Tech', label: 'M.Tech', full: 'Master of Technology',              duration: '2 years · 4 semesters' },
  { id: 'Other',  label: 'Other',  full: 'Other course',                      duration: 'Custom'               },
];

const COURSE_SEMESTERS = {
  'BCA': 6, 'MCA': 4, 'B.Tech': 8,
  'B.Com': 6, 'MBA': 4, 'M.Tech': 4, 'Other': 8,
};

function Onboarding() {
  const navigate = useNavigate();
  const { updateUser } = useAuth();

  // Academic Identity scene
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedSemester, setSelectedSemester] = useState(null);
  const [collegeName, setCollegeName] = useState('');
  const [academicSubmitting, setAcademicSubmitting] = useState(false);
  const [academicError, setAcademicError] = useState(null);

  const [currentScene, setCurrentScene] = useState(0);
  const totalScenes = 11;
  const sceneDurations = [6200, 6000, null, null, 6400, 6600, 6800, 6800, 6400, 7200, 0];

  // STRICT THEME LOGIC: No prefers-color-scheme, no inherited dark class.
  const [theme, setTheme] = useState(() => {
    const stored = localStorage.getItem('synapse-onboarding-theme');
    return stored === 'dark' ? 'dark' : 'light';
  });

  const toggleTheme = () => {
    setTheme(current => {
      const newTheme = current === 'dark' ? 'light' : 'dark';
      localStorage.setItem('synapse-onboarding-theme', newTheme);
      return newTheme;
    });
  };

  useEffect(() => {
    let timer;
    if (sceneDurations[currentScene] === null) return; // user-input scene — never auto-advance
    if (sceneDurations[currentScene] > 0) {
      timer = setTimeout(() => {
        if (currentScene < totalScenes - 1) {
          setCurrentScene(c => c + 1);
        }
      }, sceneDurations[currentScene]);
    }
    return () => clearTimeout(timer);
  }, [currentScene]);

  const nextScene = () => {
    if (currentScene === 2) {
      if (selectedCourse) {
        setCurrentScene(3);
        return;
      }
    }
    if (currentScene === 3) {
      if (selectedCourse && selectedSemester && collegeName.trim()) {
        handleAcademicContinue();
        return;
      }
    }
    if (currentScene < totalScenes - 1) {
      setCurrentScene(c => c + 1);
    } else {
      completeOnboarding();
    }
  };

  const prevScene = () => {
    setCurrentScene(c => Math.max(c - 1, 0));
  };

  const handleAcademicContinue = async () => {
    if (!selectedCourse || !selectedSemester || !collegeName.trim()) return;
    setAcademicSubmitting(true);
    setAcademicError(null);
    try {
      await api.patch('/users/profile', {
        college: collegeName.trim(),
        course: selectedCourse,
        semester: selectedSemester,
      });
      setCurrentScene(s => s + 1);
    } catch (err) {
      setAcademicError(err?.response?.data?.message || 'Something went wrong. Try again.');
    } finally {
      setAcademicSubmitting(false);
    }
  };

  const [isCompleting, setIsCompleting] = useState(false);

  const completeOnboarding = async () => {
    if (isCompleting) return;
    setIsCompleting(true);
    try {
      const res = await api.patch('/users/profile', { onboardingDone: true });
      if (updateUser && res.data && res.data.user) {
        updateUser(res.data.user);
      }
      navigate('/dashboard', { replace: true });
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
      setIsCompleting(false);
      navigate('/dashboard', { replace: true });
    }
  };

  const sceneVariants = {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1, transition: { duration: 0.7, ease: [0.175, 0.885, 0.32, 1.275] } },
    exit: { opacity: 0, scale: 1.02, transition: { duration: 0.4, ease: "easeInOut" } }
  };

  return (
    <div id="onboarding-root" data-theme={theme} className="fixed inset-0 z-[9999] bg-[var(--bg-color)] text-[var(--text-primary)] font-sans transition-colors duration-500 overflow-hidden">
      <style>{`
        [data-theme="light"] {
          --bg-color: #ffffff;
          --text-primary: #141313;
          --text-secondary: #5f5e60;
          --surface-color: rgba(255, 255, 255, 0.8);
          --border-color: rgba(0, 0, 0, 0.1);
          --input-bg: rgba(0, 0, 0, 0.05);
          --primary-color: #0566d9;
          --primary-content: #ffffff;
          --primary-bg: rgba(5, 102, 217, 0.1);
          --bottom-gradient: linear-gradient(to top, rgba(255, 255, 255, 1) 20%, rgba(255, 255, 255, 0));
          --c-academic: #0566d9;
          --c-planner: #895af4;
          --c-vault: #5516be;
          --c-finance: #004395;
          --c-insights: #313032;
        }

        [data-theme="dark"] {
          --bg-color: #0e0e0e;
          --text-primary: #e5e2e1;
          --text-secondary: #c8c5ca;
          --surface-color: rgba(32, 31, 31, 0.8);
          --border-color: rgba(255, 255, 255, 0.1);
          --input-bg: rgba(255, 255, 255, 0.05);
          --primary-color: #adc6ff;
          --primary-content: #002e6a;
          --primary-bg: rgba(173, 198, 255, 0.1);
          --bottom-gradient: linear-gradient(to top, rgba(14, 14, 14, 1) 20%, rgba(14, 14, 14, 0));
          --c-academic: #adc6ff;
          --c-planner: #d0bcff;
          --c-vault: #e9ddff;
          --c-finance: #d8e2ff;
          --c-insights: #c8c5ca;
        }

        .syn-card {
            background: var(--surface-color);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border: 0.5px solid var(--border-color);
            box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.05);
        }
        
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: var(--border-color);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: var(--text-secondary);
        }
      `}</style>

      {/* Top Nav */}
      <nav className="fixed top-0 w-full flex justify-between items-center px-6 md:px-16 py-6 z-50 transition-colors duration-500 pointer-events-none">
        <div className="text-2xl font-bold tracking-tighter text-[var(--text-primary)] pointer-events-auto drop-shadow-md">Synapse</div>
        <div className="flex items-center gap-4 pointer-events-auto drop-shadow-md">
          <button onClick={toggleTheme} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition p-2">
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <button
            onClick={() => setCurrentScene(totalScenes - 1)}
            className={`text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition ml-2 ${currentScene === totalScenes - 1 ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
          >
            Skip
          </button>
        </div>
      </nav>

      {/* Live Neurons Background */}
      <BackgroundNeurons currentScene={currentScene} totalScenes={totalScenes} />

      {/* Main Content Area */}
      <main className="relative w-full h-full z-10">
        <AnimatePresence mode="wait">

          {/* Scene 1: Scattered */}
          {currentScene === 0 && (
            <motion.div key="scene1" variants={sceneVariants} initial="initial" animate="animate" exit="exit" className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden">
              <div className="absolute inset-0 w-full h-full pointer-events-none">
                {/* Floating abstract elements representing "scattered" life */}
                <motion.div animate={{ y: [0, -15, 0], x: [0, 10, 0], rotate: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }} className="absolute top-[15%] left-[5%] md:left-[15%] syn-card p-4 rounded-2xl opacity-60">
                  <FileText className="w-8 h-8 text-[var(--primary-color)]" />
                </motion.div>
                <motion.div animate={{ y: [0, 20, 0], x: [0, -15, 0], rotate: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 0.5 }} className="absolute top-[70%] left-[10%] md:left-[20%] syn-card p-4 rounded-2xl opacity-50">
                  <Calendar className="w-10 h-10 text-[var(--c-planner)]" />
                </motion.div>
                <motion.div animate={{ y: [0, -25, 0], x: [0, -10, 0], rotate: [0, 15, 0] }} transition={{ repeat: Infinity, duration: 6, ease: "easeInOut", delay: 1 }} className="absolute top-[20%] right-[5%] md:right-[20%] syn-card p-5 rounded-2xl opacity-50">
                  <MessageCircle className="w-8 h-8 text-[var(--c-finance)]" />
                </motion.div>
                <motion.div animate={{ y: [0, 25, 0], x: [0, 20, 0], rotate: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 4.5, ease: "easeInOut", delay: 1.5 }} className="absolute top-[65%] right-[10%] md:right-[15%] syn-card p-4 rounded-2xl opacity-70">
                  <Briefcase className="w-6 h-6 text-[var(--c-vault)]" />
                </motion.div>
                <motion.div animate={{ y: [0, -10, 0], scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut", delay: 2 }} className="absolute top-[40%] left-[2%] md:left-[8%] syn-card p-3 rounded-xl opacity-40">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                </motion.div>
                <motion.div animate={{ y: [0, 15, 0], scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 5.5, ease: "easeInOut", delay: 0.8 }} className="absolute top-[45%] right-[2%] md:right-[8%] syn-card p-3 rounded-xl opacity-40">
                  <GraduationCap className="w-7 h-7 text-[var(--c-insights)]" />
                </motion.div>
              </div>

              <div className="z-10 text-center max-w-2xl px-6 flex flex-col items-center mt-[-10vh]">
                <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.8, ease: "easeOut" }} className="mb-8 inline-flex items-center justify-center p-5 rounded-3xl bg-[var(--input-bg)] border border-[var(--border-color)]">
                  <Compass className="w-10 h-10 text-[var(--primary-color)]" />
                </motion.div>
                <motion.h1 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3, duration: 0.8 }} className="text-5xl md:text-7xl font-semibold tracking-tighter text-[var(--text-primary)] mb-6">
                  Student life is <span className="text-[var(--text-secondary)] italic">scattered.</span>
                </motion.h1>
                <motion.p initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6, duration: 0.8 }} className="text-xl md:text-2xl text-[var(--text-secondary)] leading-relaxed">
                  Notes in one app. Deadlines in another.<br className="hidden md:block" /> Chats everywhere.
                </motion.p>
              </div>
            </motion.div>
          )}

          {/* Scene 1: Real problem */}
          {currentScene === 1 && (
            <motion.div key="scene2" variants={sceneVariants} initial="initial" animate="animate" exit="exit" className="absolute inset-0 flex flex-col items-center pt-28 pb-32 px-6 overflow-y-auto custom-scrollbar">
              <div className="text-center max-w-3xl mb-10 shrink-0">
                <h2 className="font-display text-4xl md:text-5xl font-semibold tracking-tighter text-[var(--text-primary)] mb-6">The science of struggle</h2>
                <p className="text-lg text-[var(--text-secondary)] leading-relaxed">It's not a lack of effort. It's a structural failure in how we learn.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full max-w-6xl shrink-0">
                {/* Card 1: Procrastination */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="syn-card p-6 md:p-8 rounded-3xl flex flex-col items-center text-center border-t-4 border-orange-500/80">
                  <div className="inline-flex items-center justify-center p-3 rounded-full bg-orange-500/10 mb-5">
                    <Clock className="w-6 h-6 text-orange-500" />
                  </div>
                  <div className="text-4xl md:text-5xl font-bold text-[var(--text-primary)] tracking-tighter mb-2">80-95%</div>
                  <h3 className="font-display text-base font-medium text-orange-500 mb-4">Procrastination Rate</h3>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed text-center">Landmark meta-analytic research by Dr. Piers Steel at the University of Calgary reveals that 80% to 95% of college students procrastinate on their coursework.</p>
                </motion.div>

                {/* Card 2: 40% Drop */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="syn-card p-6 md:p-8 rounded-3xl flex flex-col items-center text-center border-t-4 border-red-500/80">
                  <div className="inline-flex items-center justify-center p-3 rounded-full bg-red-500/10 mb-5">
                    <TrendingDown className="w-6 h-6 text-red-500" />
                  </div>
                  <div className="text-4xl md:text-5xl font-bold text-[var(--text-primary)] tracking-tighter mb-2">-40%</div>
                  <h3 className="font-display text-base font-medium text-red-500 mb-4">Productivity Drop</h3>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed text-center">Academic studies evaluating digital study habits show that students who constantly swap between social media and coursework experience up to a 40% drop in overall productivity.</p>
                </motion.div>

                {/* Card 3: Forgetting Curve */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="syn-card p-6 md:p-8 rounded-3xl flex flex-col items-center text-center border-t-4 border-blue-500/80">
                  <div className="inline-flex items-center justify-center p-3 rounded-full bg-blue-500/10 mb-5">
                    <Brain className="w-6 h-6 text-blue-500" />
                  </div>
                  <div className="text-4xl md:text-5xl font-bold text-[var(--text-primary)] tracking-tighter mb-2">70%</div>
                  <h3 className="font-display text-base font-medium text-blue-500 mb-4">Information Loss</h3>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed text-center">Classic psychological research demonstrates that humans forget roughly 50% of new information within 20 minutes of learning it, and 70% of it within 24 hours if it is not actively reviewed.</p>
                </motion.div>
              </div>
            </motion.div>
          )}

          {/* Scene 2: Academic Profile */}
          {currentScene === 2 && (
            <motion.div
              key="academic-identity"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1, transition: { duration: 0.7, ease: [0.175, 0.885, 0.32, 1.275] } }}
              exit={{ opacity: 0, scale: 1.02, transition: { duration: 0.4, ease: "easeInOut" } }}
              className="absolute inset-0 flex flex-col items-center pt-28 pb-48 px-6 overflow-y-auto custom-scrollbar"
            >
              <div className="w-full max-w-4xl mx-auto flex flex-col gap-8">
                <div className="text-center md:text-left">
                  <h2 className="font-display text-4xl md:text-5xl font-semibold tracking-tighter text-[var(--text-primary)] mb-2">Step 1: Academic Profile</h2>
                  <p className="text-lg text-[var(--text-secondary)] leading-relaxed">Select your current course to personalize your learning journey.</p>
                </div>

                <section>
                  <h3 className="font-display text-sm font-semibold uppercase tracking-wider mb-6 text-[var(--text-secondary)]">Select your course</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {COURSES.map(course => (
                      <button
                        key={course.id}
                        type="button"
                        onClick={() => {
                          setSelectedCourse(course.id);
                          setSelectedSemester(null);
                          setCollegeName('');
                        }}
                        className={`syn-card p-4 rounded-xl cursor-pointer flex flex-col items-start gap-1 text-left relative transition-all ${selectedCourse === course.id ? 'border-[var(--primary-color)] border-2 bg-[var(--primary-bg)]' : ''}`}
                      >
                        {selectedCourse === course.id && (
                          <div className="absolute top-3 right-3 text-[var(--primary-color)]">
                            <CheckCircle2 className="w-5 h-5" />
                          </div>
                        )}
                        <span className="text-lg font-semibold text-[var(--text-primary)]">{course.label}</span>
                        <span className="text-xs font-medium text-[var(--text-secondary)]">{course.full}</span>
                      </button>
                    ))}
                  </div>
                </section>
                
                <div className="flex justify-center mt-6">
                  <button type="button" onClick={() => setCurrentScene(4)} className="text-sm font-medium text-[var(--text-secondary)] underline hover:text-[var(--text-primary)] transition-all">
                    Skip this step
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Scene 3: University Details */}
          {currentScene === 3 && (
            <motion.div
              key="university-details"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1, transition: { duration: 0.7, ease: [0.175, 0.885, 0.32, 1.275] } }}
              exit={{ opacity: 0, scale: 1.02, transition: { duration: 0.4, ease: "easeInOut" } }}
              className="absolute inset-0 flex flex-col items-center justify-center px-6"
            >
              <div className="w-full max-w-2xl mx-auto flex flex-col gap-10">
                <div className="text-center">
                  <h2 className="font-display text-4xl md:text-5xl font-semibold tracking-tighter text-[var(--text-primary)] mb-4">Step 2: University Details</h2>
                  <p className="text-lg text-[var(--text-secondary)] leading-relaxed">Tell us where you are studying to customize your experience.</p>
                </div>

                <div className="syn-card p-8 md:p-10 rounded-3xl w-full flex flex-col gap-8 shadow-[0_0_40px_rgba(99,102,241,0.05)] border border-[var(--border-color)] relative overflow-hidden">
                  <div className="relative z-10 w-full">
                    <div className="relative w-full">
                      <input
                        id="college-name-2"
                        type="text"
                        value={collegeName}
                        onChange={e => setCollegeName(e.target.value)}
                        placeholder=" "
                        className="block px-5 pb-3 pt-7 w-full text-[var(--text-primary)] bg-[var(--input-bg)] rounded-xl border border-[var(--border-color)] focus:border-[var(--primary-color)] focus:ring-1 focus:ring-[var(--primary-color)] appearance-none focus:outline-none peer transition-all shadow-inner text-base"
                      />
                      <label htmlFor="college-name-2" className="absolute text-sm font-medium text-[var(--text-secondary)] duration-300 transform -translate-y-4 scale-75 top-5 z-10 origin-[0] left-5 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-4 peer-focus:text-[var(--primary-color)]">
                        College / University Name
                      </label>
                    </div>
                  </div>

                  <div className="relative z-10 w-full">
                    <h3 className="font-display text-sm font-semibold uppercase tracking-wider mb-4 text-[var(--text-secondary)]">Current Semester</h3>
                    <div className="flex flex-wrap gap-3">
                      {Array.from({ length: selectedCourse ? COURSE_SEMESTERS[selectedCourse] : 8 }, (_, i) => i + 1).map(n => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setSelectedSemester(n)}
                          className={`flex-1 min-w-[80px] py-3 rounded-full border transition-all font-medium text-sm text-center ${selectedSemester === n ? 'bg-[var(--primary-color)] text-white border-[var(--primary-color)] shadow-lg shadow-[var(--primary-color)]/20' : 'border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--input-bg)]'}`}
                        >
                          Sem {n}
                        </button>
                      ))}
                    </div>
                    {academicError && <p className="text-red-500 text-sm mt-4 text-center">{academicError}</p>}
                  </div>
                </div>
                
                <div className="flex justify-center mt-2">
                  <button type="button" onClick={() => setCurrentScene(4)} className="text-sm font-medium text-[var(--text-secondary)] underline hover:text-[var(--text-primary)] transition-all">
                    Skip this step
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Scene 4: Connection */}
          {currentScene === 4 && (
            <motion.div key="scene3" variants={sceneVariants} initial="initial" animate="animate" exit="exit" className="absolute inset-0 flex flex-col items-center justify-center px-6">
              <div className="text-center max-w-2xl mb-12">
                <h2 className="font-display text-4xl md:text-5xl font-semibold tracking-tighter text-[var(--text-primary)] mb-6">The right tools change everything</h2>
                <p className="text-lg text-[var(--text-secondary)] leading-relaxed">Stop fighting your scattered notes. Start using systems that work.</p>
              </div>

              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }} className="syn-card p-8 md:p-10 rounded-3xl max-w-3xl w-full flex flex-col md:flex-row items-center gap-10 border-2 border-green-500/20 shadow-[0_0_40px_rgba(34,197,94,0.05)]">
                <div className="flex-1 text-center md:text-left flex flex-col items-center md:items-start border-b md:border-b-0 md:border-r border-[var(--border-color)] pb-8 md:pb-0 md:pr-10">
                  <div className="inline-flex items-center justify-center p-4 rounded-full bg-green-500/10 mb-6">
                    <TrendingUp className="w-10 h-10 text-green-500" />
                  </div>
                  <div className="text-7xl font-bold text-[var(--text-primary)] tracking-tighter mb-2">76%</div>
                  <div className="text-xl font-medium text-green-500">Grade Improvement</div>
                </div>
                <div className="flex-1">
                  <p className="text-base text-[var(--text-primary)] leading-relaxed font-medium mb-6">
                    76% of students using specialized digital note-taking features improved their overall grades in just a single semester.
                  </p>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 opacity-50">
                      <FileText className="w-5 h-5 text-red-500" />
                      <span className="line-through text-sm text-[var(--text-secondary)]">Scattered PDF highlights</span>
                    </div>
                    <div className="flex items-center gap-3 opacity-50">
                      <AlignLeft className="w-5 h-5 text-red-500" />
                      <span className="line-through text-sm text-[var(--text-secondary)]">Lost physical notebooks</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-[var(--primary-color)]" />
                      <span className="font-medium text-sm text-[var(--text-primary)]">Unified, interactive intelligence</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* Scene 5: Academic Brain */}
          {currentScene === 5 && (
            <motion.div key="scene4" variants={sceneVariants} initial="initial" animate="animate" exit="exit" className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="syn-card p-8 rounded-3xl w-full max-w-md mx-4">
                <div className="flex justify-between items-start mb-6">
                  <h2 className="font-display text-3xl font-medium tracking-tighter text-[var(--text-primary)]">Academic Brain</h2>
                  <BrainCircuit className="text-[var(--primary-color)] w-10 h-10" />
                </div>
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-[var(--input-bg)]">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-[var(--text-secondary)]">Course</span>
                      <span className="text-xl font-medium text-[var(--text-primary)]">Data Structures</span>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-1 p-4 rounded-xl bg-[var(--input-bg)]">
                      <span className="block text-sm text-[var(--text-secondary)] mb-1">CGPA counts</span>
                      <div className="flex items-baseline gap-2">
                        <span className="text-xl font-medium text-gray-400 line-through">7.2</span>
                        <ArrowRight className="w-4 h-4 text-[var(--primary-color)]" />
                        <span className="text-xl font-medium text-[var(--primary-color)]">7.6</span>
                      </div>
                    </div>
                    <div className="flex-1 p-4 rounded-xl bg-[var(--input-bg)]">
                      <span className="block text-sm text-[var(--text-secondary)] mb-1">Internal mark</span>
                      <span className="text-xl font-medium text-[var(--text-primary)]">38/40</span>
                    </div>
                  </div>
                  <div className="p-4 rounded-xl border border-red-200/50 flex items-center justify-between" style={{ background: 'rgba(239,68,68,0.05)' }}>
                    <span className="text-sm font-medium text-red-500">Attendance 71%</span>
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Scene 6: AI Notebook */}
          {currentScene === 6 && (
            <motion.div key="scene5" variants={sceneVariants} initial="initial" animate="animate" exit="exit" className="absolute inset-0 flex flex-col items-center justify-center px-4">
              <div className="text-center max-w-xl mb-12">
                <h2 className="font-display text-4xl font-semibold tracking-tighter text-[var(--text-primary)] mb-4">Your notes, but you can ask them questions</h2>
                <p className="text-lg text-[var(--text-secondary)] leading-relaxed">Upload a lecture PDF. Synapse explains it back the way your professor taught it — not a generic internet answer.</p>
              </div>
              <div className="syn-card w-full max-w-[360px] p-6 rounded-3xl flex flex-col gap-4">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="flex items-center gap-3 p-3 rounded-xl bg-[var(--input-bg)]">
                  <FileText className="w-6 h-6 text-[var(--primary-color)]" />
                  <span className="text-sm font-medium text-[var(--text-primary)]">DBMS_Lecture_8.pdf</span>
                </motion.div>

                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.8 }} className="self-start max-w-[85%] p-3 rounded-2xl rounded-tl-sm bg-[var(--input-bg)] text-[var(--text-primary)] text-sm">
                  What's the difference between 2NF and 3NF?
                </motion.div>

                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.0 }} className="self-end max-w-[85%] relative">
                  <TypingIndicator duration={0.4}>
                    <div className="p-3 rounded-2xl rounded-tr-sm bg-[var(--primary-color)] text-[var(--primary-content)] text-sm">
                      Based on your notes: 2NF removes partial dependencies, 3NF removes transitive ones — same example your professor used with the Student table.
                    </div>
                  </TypingIndicator>
                </motion.div>
              </div>
            </motion.div>
          )}

          {/* Scene 7: Study Groups */}
          {currentScene === 7 && (
            <motion.div key="scene6" variants={sceneVariants} initial="initial" animate="animate" exit="exit" className="absolute inset-0 flex flex-col items-center justify-center px-4">
              <div className="text-center max-w-xl mb-12">
                <h2 className="font-display text-4xl font-semibold tracking-tighter text-[var(--text-primary)] mb-4">Real-time chat, built for studying</h2>
                <p className="text-lg text-[var(--text-secondary)] leading-relaxed">Share a notebook summary straight into your group chat. No switching to WhatsApp to explain what you just learned.</p>
              </div>
              <div className="syn-card w-full max-w-[360px] p-0 rounded-3xl flex flex-col overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-[var(--border-color)] bg-[var(--bg-color)]/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[var(--primary-bg)] flex items-center justify-center">
                      <Users className="w-5 h-5 text-[var(--primary-color)]" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-[var(--text-primary)]">DBMS Study Group</h4>
                      <span className="text-xs text-green-500 font-medium">4 online</span>
                    </div>
                  </div>
                </div>
                <div className="p-6 flex flex-col gap-4 bg-[var(--surface-color)]">
                  <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="self-start max-w-[85%] p-3 rounded-2xl rounded-tl-sm bg-[var(--input-bg)] text-[var(--text-primary)] text-sm">
                    anyone get Q3 on the assignment?
                  </motion.div>

                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.0 }} className="self-end max-w-[95%] relative">
                    <TypingIndicator duration={0.6}>
                      <div className="p-4 rounded-2xl rounded-tr-sm bg-[var(--primary-bg)] border border-[var(--primary-color)]/20 text-sm flex flex-col gap-3">
                        <span className="text-[var(--text-primary)]">shared notebook summary</span>
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-color)] border border-[var(--border-color)]">
                          <FileText className="w-5 h-5 text-[var(--primary-color)]" />
                          <div className="flex flex-col">
                            <span className="text-xs font-semibold text-[var(--text-primary)]">DBMS_Lecture_8.pdf</span>
                            <span className="text-[10px] text-[var(--text-secondary)]">Normalization</span>
                          </div>
                        </div>
                      </div>
                    </TypingIndicator>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Scene 8: Career Brain */}
          {currentScene === 8 && (
            <motion.div key="scene7" variants={sceneVariants} initial="initial" animate="animate" exit="exit" className="absolute inset-0 flex flex-col items-center justify-center px-4">
              <div className="text-center max-w-xl mb-8">
                <h2 className="font-display text-4xl font-semibold tracking-tighter text-[var(--text-primary)] mb-4">A resume that gets past ATS</h2>
                <p className="text-lg text-[var(--text-secondary)] leading-relaxed">Synapse analyzes your academic work and projects to auto-generate a tailored, high-converting resume.</p>
              </div>

              <div className="relative w-full max-w-[360px] h-[280px] flex items-center justify-center">

                {/* Creating State (0 to 3s) */}
                <motion.div
                  initial={{ opacity: 1 }}
                  animate={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: 3.0, duration: 0.5 }}
                  className="absolute inset-0 flex flex-col items-center justify-center w-full z-20 pointer-events-none"
                >
                  <div className="syn-card p-8 rounded-3xl w-full h-full flex flex-col items-center justify-center border border-[var(--primary-color)]/20 shadow-lg bg-[var(--bg-color)]">
                    <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1.5 }} className="mb-4">
                      <Brain className="w-10 h-10 text-[var(--primary-color)]" />
                    </motion.div>
                    <h3 className="font-display text-xl font-medium text-[var(--text-primary)] mb-6">Crafting your resume...</h3>

                    <div className="w-full space-y-4">
                      <div className="flex items-center gap-3">
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5 }}><CheckCircle2 className="w-5 h-5 text-green-500" /></motion.div>
                        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }} className="text-sm text-[var(--text-secondary)]">Analyzing GitHub projects</motion.div>
                      </div>
                      <div className="flex items-center gap-3">
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1.2 }}><CheckCircle2 className="w-5 h-5 text-green-500" /></motion.div>
                        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.2 }} className="text-sm text-[var(--text-secondary)]">Extracting skills</motion.div>
                      </div>
                      <div className="flex items-center gap-3">
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 2.0 }}><CheckCircle2 className="w-5 h-5 text-[var(--primary-color)]" /></motion.div>
                        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 2.0 }} className="text-sm text-[var(--text-primary)] font-medium">Optimizing for ATS</motion.div>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Final Result (After 3.2s) */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 3.2, duration: 0.6, type: "spring" }}
                  className="absolute inset-0 flex items-center justify-center w-full z-10"
                >
                  <div className="absolute w-[90%] h-full syn-card rounded-3xl -translate-y-4 scale-95 opacity-40"></div>
                  <div className="absolute w-[95%] h-full syn-card rounded-3xl -translate-y-2 scale-100 opacity-70"></div>
                  <div className="absolute w-full h-full p-8 syn-card rounded-3xl z-10 flex flex-col items-center justify-center text-center border border-[var(--primary-color)]/20 shadow-[0_8px_30px_rgba(5,102,217,0.15)] bg-[var(--surface-color)]">
                    <FileCheck className="text-[var(--primary-color)] w-12 h-12 mb-4" />
                    <h2 className="font-display text-2xl font-medium mb-4 text-[var(--text-primary)]">Resume.pdf</h2>
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 bg-[var(--primary-bg)] text-[var(--primary-color)]">
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="text-sm font-semibold">ATS 88</span>
                    </div>
                    <div className="flex gap-3 justify-center w-full">
                      <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 3.6 }} className="px-3 py-1 rounded-full border border-[var(--border-color)] text-[var(--text-secondary)] text-sm">+ SQL</motion.div>
                      <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 3.8 }} className="px-3 py-1 rounded-full border border-[var(--border-color)] text-[var(--text-secondary)] text-sm">+ Docker</motion.div>
                    </div>
                  </div>
                </motion.div>

              </div>
            </motion.div>
          )}

          {/* Scene 9: Resource Explorer */}
          {currentScene === 9 && (
            <motion.div key="scene8_resource" variants={sceneVariants} initial="initial" animate="animate" exit="exit" className="absolute inset-0 flex flex-col items-center pt-28 px-6 pb-48 overflow-y-auto custom-scrollbar">
              <div className="text-center max-w-xl mb-8 shrink-0">
                <h2 className="font-display text-4xl md:text-5xl font-semibold tracking-tighter text-[var(--text-primary)] mb-4">Master any topic, instantly</h2>
                <p className="text-lg text-[var(--text-secondary)] leading-relaxed">Enter a subject. Resource Explorer generates a complete learning roadmap with curated resources, ready to export.</p>
              </div>

              <div className="syn-card p-6 md:p-8 rounded-3xl w-full max-w-2xl mx-auto flex flex-col gap-6 shrink-0">
                {/* Input Phase */}
                <div className="flex items-center gap-4 bg-[var(--input-bg)] p-3 md:p-4 rounded-2xl border border-[var(--border-color)]">
                  <Compass className="w-6 h-6 text-[var(--primary-color)] shrink-0" />
                  <div className="flex-1 overflow-hidden relative h-6">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 1.5, delay: 0.5, ease: "linear" }}
                      className="overflow-hidden whitespace-nowrap text-[var(--text-primary)] font-medium font-mono text-sm md:text-base"
                    >
                      I want to learn System Design...
                    </motion.div>
                  </div>
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 2.2 }}
                    className="bg-[var(--primary-color)] text-[var(--primary-content)] p-2 rounded-full flex items-center justify-center shrink-0"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </motion.div>
                </div>

                {/* Roadmap Building Phase */}
                <div className="relative mt-2 pl-4 md:pl-10">
                  {/* Line connecting nodes */}
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: "calc(100% - 24px)" }}
                    transition={{ duration: 1.5, delay: 2.5, ease: "easeInOut" }}
                    className="absolute roadmap-line top-5 w-[2px] bg-gradient-to-b from-[var(--primary-color)] to-[var(--c-planner)] z-0 origin-top"
                  />

                  <div className="flex flex-col gap-5 relative z-10">
                    {/* Node 1 */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 3, duration: 0.5 }}
                      className="flex items-center gap-4 md:gap-6 group"
                    >
                      <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 3, type: "spring", stiffness: 200, damping: 20 }}
                        whileHover={{ scale: 1.1 }}
                        className="w-10 h-10 rounded-full bg-[var(--bg-color)] border-2 border-[var(--primary-color)] flex items-center justify-center shrink-0 relative z-10 shadow-sm transition-colors group-hover:bg-[var(--primary-color)] group-hover:text-white"
                      >
                        <span className="font-bold text-sm text-[var(--primary-color)] group-hover:text-white transition-colors">1</span>
                      </motion.div>
                      <div className="bg-[var(--bg-color)] border border-[var(--border-color)] p-4 rounded-xl flex-1 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 hover:shadow-md hover:border-[var(--primary-color)] transition-all">
                        <div>
                          <h4 className="font-semibold text-[var(--text-primary)] mb-0.5">Client-Server Model</h4>
                          <p className="text-xs text-[var(--text-secondary)]">2 hrs • Foundational</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <div className="bg-red-500/10 text-red-500 text-xs font-semibold px-2.5 py-1 rounded-md flex items-center gap-1"><FileText className="w-3 h-3" /> PDF</div>
                          <div className="bg-blue-500/10 text-blue-500 text-xs font-semibold px-2.5 py-1 rounded-md flex items-center gap-1"><PlayCircle className="w-3 h-3" /> Video</div>
                        </div>
                      </div>
                    </motion.div>

                    {/* Node 2 */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 3.5, duration: 0.5 }}
                      className="flex items-center gap-4 md:gap-6 group"
                    >
                      <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 3.5, type: "spring", stiffness: 200, damping: 20 }}
                        whileHover={{ scale: 1.1 }}
                        className="w-10 h-10 rounded-full bg-[var(--bg-color)] border-2 border-[var(--primary-color)] flex items-center justify-center shrink-0 relative z-10 shadow-sm transition-colors group-hover:bg-[var(--primary-color)] group-hover:text-white"
                      >
                        <span className="font-bold text-sm text-[var(--primary-color)] group-hover:text-white transition-colors">2</span>
                      </motion.div>
                      <div className="bg-[var(--bg-color)] border border-[var(--border-color)] p-4 rounded-xl flex-1 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 hover:shadow-md hover:border-[var(--primary-color)] transition-all">
                        <div>
                          <h4 className="font-semibold text-[var(--text-primary)] mb-0.5">Load Balancing</h4>
                          <p className="text-xs text-[var(--text-secondary)]">3.5 hrs • Intermediate</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <div className="bg-green-500/10 text-green-500 text-xs font-semibold px-2.5 py-1 rounded-md flex items-center gap-1"><AlignLeft className="w-3 h-3" /> Article</div>
                          <div className="bg-blue-500/10 text-blue-500 text-xs font-semibold px-2.5 py-1 rounded-md flex items-center gap-1"><PlayCircle className="w-3 h-3" /> Video</div>
                        </div>
                      </div>
                    </motion.div>

                    {/* Node 3 */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 4, duration: 0.5 }}
                      className="flex items-center gap-4 md:gap-6 group"
                    >
                      <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 4, type: "spring", stiffness: 200, damping: 20 }}
                        whileHover={{ scale: 1.1 }}
                        className="w-10 h-10 rounded-full bg-[var(--bg-color)] border-2 border-[var(--primary-color)] flex items-center justify-center shrink-0 relative z-10 shadow-sm transition-colors group-hover:bg-[var(--primary-color)] group-hover:text-white"
                      >
                        <span className="font-bold text-sm text-[var(--primary-color)] group-hover:text-white transition-colors">3</span>
                      </motion.div>
                      <div className="bg-[var(--bg-color)] border border-[var(--border-color)] p-4 rounded-xl flex-1 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 hover:shadow-md hover:border-[var(--primary-color)] transition-all">
                        <div>
                          <h4 className="font-semibold text-[var(--text-primary)] mb-0.5">Database Sharding</h4>
                          <p className="text-xs text-[var(--text-secondary)]">4 hrs • Advanced</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <div className="bg-purple-500/10 text-purple-500 text-xs font-semibold px-2.5 py-1 rounded-md flex items-center gap-1"><Book className="w-3 h-3" /> Book</div>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </div>

                {/* Export Button */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 5 }}
                  className="mt-2 flex justify-end"
                >
                  <button className="flex items-center gap-2 bg-[var(--primary-color)] text-[var(--primary-content)] px-6 py-2.5 rounded-full font-semibold text-sm shadow-[0_0_20px_rgba(5,102,217,0.3)] transition-transform hover:scale-105">
                    <Calendar className="w-4 h-4" />
                    Export to Planner
                  </button>
                </motion.div>
              </div>
            </motion.div>
          )}

          {/* Scene 10: Welcome Bento */}
          {currentScene === 10 && (
            <motion.div key="scene8" variants={sceneVariants} initial="initial" animate="animate" exit="exit" className="absolute inset-0 flex flex-col items-center pt-24 pb-32 px-4 overflow-y-auto custom-scrollbar">
              <div className="w-full max-w-4xl flex flex-col items-center mt-auto mb-auto">
                <div className="text-center mb-10 shrink-0">
                  <h1 className="font-display text-5xl font-semibold tracking-tighter mb-3 text-[var(--text-primary)]">This is Synapse</h1>
                  <p className="text-lg text-[var(--text-secondary)]">Your intelligence, augmented.</p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6 w-full shrink-0">
                  <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="syn-card p-6 rounded-3xl flex flex-col items-center justify-center text-center">
                    <BookOpen className="w-8 h-8 mb-4 text-[var(--c-academic)]" />
                    <h3 className="font-display text-lg font-semibold text-[var(--text-primary)]">AI Notebook</h3>
                  </motion.div>
                  <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="syn-card p-6 rounded-3xl flex flex-col items-center justify-center text-center border-2 border-[var(--primary-color)]">
                    <MessageCircle className="w-8 h-8 mb-4 text-[var(--primary-color)]" />
                    <h3 className="font-display text-lg font-semibold text-[var(--text-primary)]">Study Groups</h3>
                  </motion.div>
                  <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="syn-card p-6 rounded-3xl flex flex-col items-center justify-center text-center">
                    <FileText className="w-8 h-8 mb-4 text-[var(--c-planner)]" />
                    <h3 className="font-display text-lg font-semibold text-[var(--text-primary)]">Resume Intelligence</h3>
                  </motion.div>
                  <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }} className="syn-card p-6 rounded-3xl flex flex-col items-center justify-center text-center">
                    <Compass className="w-8 h-8 mb-4 text-[var(--c-finance)]" />
                    <h3 className="font-display text-lg font-semibold text-[var(--text-primary)]">Resource Explorer</h3>
                  </motion.div>
                  <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }} className="syn-card p-6 rounded-3xl flex flex-col items-center justify-center text-center">
                    <Briefcase className="w-8 h-8 mb-4 text-[var(--c-vault)]" />
                    <h3 className="font-display text-lg font-semibold text-[var(--text-primary)]">Career Vault</h3>
                  </motion.div>
                  <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6 }} className="syn-card p-6 rounded-3xl flex flex-col items-center justify-center text-center gap-3 h-full">
                    <Sparkles className="w-6 h-6 text-[var(--text-primary)]" />
                    <span className="font-medium text-[var(--text-primary)]">Today Dashboard</span>
                  </motion.div>
                </div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }} className="mt-16 flex justify-center w-full shrink-0 pb-12">
                  <button onClick={completeOnboarding} className="group relative inline-flex items-center justify-center gap-3 px-10 py-5 bg-[var(--primary-color)] text-[var(--primary-content)] rounded-full font-semibold text-xl overflow-hidden transition-transform hover:scale-105 active:scale-95 shadow-[0_0_40px_rgba(5,102,217,0.3)]">
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out rounded-full" />
                    <Sparkles className="w-6 h-6 relative z-10" />
                    <span className="relative z-10">Launch Synapse</span>
                    <ArrowRight className="w-6 h-6 relative z-10 group-hover:translate-x-1 transition-transform" />
                  </button>
                </motion.div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* Bottom Nav / Progress Chain */}
      <div className="fixed bottom-0 left-0 w-full z-50 flex flex-col justify-end pointer-events-none transition-colors duration-500" style={{ background: 'var(--bottom-gradient)' }}>
        <div className="flex justify-between items-center w-full max-w-2xl mx-auto px-4 sm:px-8 pb-8 pt-24 pointer-events-auto">
          {/* Back Button */}
          <div className="flex-1 flex justify-start">
            <button type="button" onClick={prevScene} className={`text-sm font-medium text-[var(--text-secondary)] ${currentScene === 0 ? 'opacity-0 pointer-events-none' : 'opacity-50 hover:opacity-100'} transition-opacity px-2 sm:px-4 py-2`}>
              Back
            </button>
          </div>
          
          {/* Progress Dots */}
          <div className="flex items-center gap-1.5 sm:gap-2 justify-center">
            {[...Array(totalScenes)].map((_, i) => (
              <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${i === currentScene ? 'w-6 sm:w-8 bg-[var(--primary-color)]' : 'w-1.5 sm:w-2 bg-[var(--text-primary)] opacity-20'}`} />
            ))}
          </div>

          {/* Next Button */}
          <div className="flex-1 flex justify-end">
            {currentScene < totalScenes - 1 ? (
              <button 
                type="button" 
                onClick={nextScene} 
                disabled={
                  (currentScene === 2 && !selectedCourse) ||
                  (currentScene === 3 && (!selectedSemester || !collegeName.trim() || academicSubmitting))
                }
                className="text-sm font-medium bg-[var(--bg-color)] hover:bg-[var(--primary-color)] hover:text-[var(--primary-content)] px-4 sm:px-6 py-2 rounded-full transition-all duration-300 text-[var(--primary-color)] border border-[var(--primary-color)] flex items-center justify-center min-w-[80px] sm:min-w-[100px] shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {currentScene === 3 && academicSubmitting ? 'Saving...' : 'Next'}
              </button>
            ) : (
              <div className="min-w-[80px] sm:min-w-[100px]" />
            )}
          </div>
        </div>
      </div>

    </div>
  );
}

export default Onboarding;
