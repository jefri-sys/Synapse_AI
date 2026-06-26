import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import './Landing.css';
import { BookOpen, BrainCircuit, Calendar, LineChart, Brain, Sparkles, ArrowRight, Zap, Target, MessageSquare, LayoutDashboard, Briefcase, FileText } from 'lucide-react';
import brainNetworkImg from '../../assets/brain_network.png';

const ZeroGravityBrain = () => {
  const arms = [
    { angle: -45, len: 220, dur: '8s', icon: <Calendar size={28} color="var(--marketing-accent-primary)" />, delay: '0s' },
    { angle: 45, len: 240, dur: '10s', icon: <LineChart size={28} color="var(--marketing-warning)" />, delay: '-2s' },
    { angle: 180, len: 280, dur: '12s', icon: <BookOpen size={28} color="var(--marketing-accent-secondary)" />, delay: '-4s' },
    { angle: 0, len: 260, dur: '9s', icon: <Target size={28} color="var(--marketing-accent-tertiary)" />, delay: '-1s' },
    { angle: 135, len: 230, dur: '11s', icon: <MessageSquare size={28} color="var(--marketing-accent-quaternary)" />, delay: '-3s' },
    { angle: 225, len: 250, dur: '13s', icon: <LayoutDashboard size={28} color="var(--marketing-success)" />, delay: '-5s' },
  ];

  return (
    <div className="zero-g-container">
      {/* Central Brain Core uses the exact image requested */}
      <div className="zg-core">
        <div className="zg-core-pulse"></div>
        {/* Masking the image to beautifully feather the harsh square edges */}
        <div className="zg-brain-mask">
          <img src={brainNetworkImg} className="zg-brain-img" alt="Neural Brain" />
        </div>
      </div>

      {/* Dynamic floating app components connected by synapses */}
      {arms.map((arm, i) => (
        <div className="zg-arm-rotator" key={i} style={{ transform: `rotate(${arm.angle}deg)` }}>
          <div className="zg-arm" style={{ width: `${arm.len}px`, animationDuration: arm.dur, animationDelay: arm.delay }}>
            <div className="zg-line" style={{ animationDelay: arm.delay }}></div>
            <div className="zg-node-wrapper" style={{ animationDuration: arm.dur, animationDelay: arm.delay }}>
              <div className="zg-node" style={{ transform: `rotate(${-arm.angle}deg)` }}>
                {arm.icon}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const NeuronsAnimation = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let particles = [];
    let pulses = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    const numParticles = 120; // Increased for full screen
    const connectionDistance = 150;
    const colors = {
      neuron: 'rgba(56, 189, 248, 0.6)', 
      line: 'rgba(56, 189, 248, 0.15)',
      pulse: 'rgba(249, 115, 22, 0.9)' 
    };

    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = (Math.random() - 0.5) * 0.5;
        this.radius = Math.random() * 2 + 1;
      }
      update() {
        this.x += this.vx;
        this.y += this.vy;
        if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
        if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
      }
      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = colors.neuron;
        ctx.fill();
      }
    }

    class Pulse {
      constructor(p1, p2) {
        this.p1 = p1;
        this.p2 = p2;
        this.progress = 0;
        this.speed = Math.random() * 0.02 + 0.01;
      }
      update() {
        this.progress += this.speed;
        return this.progress >= 1;
      }
      draw() {
        const x = this.p1.x + (this.p2.x - this.p1.x) * this.progress;
        const y = this.p1.y + (this.p2.y - this.p1.y) * this.progress;
        ctx.beginPath();
        ctx.arc(x, y, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = colors.pulse;
        ctx.shadowBlur = 10;
        ctx.shadowColor = colors.pulse;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    for (let i = 0; i < numParticles; i++) {
      particles.push(new Particle());
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach(p => {
        p.update();
        p.draw();
      });

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < connectionDistance) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(56, 189, 248, ${0.2 - (dist/connectionDistance)*0.2})`;
            ctx.stroke();

            if (Math.random() < 0.002) {
              pulses.push(new Pulse(particles[i], particles[j]));
            }
          }
        }
      }

      pulses = pulses.filter(pulse => {
        const finished = pulse.update();
        if (!finished) pulse.draw();
        return !finished;
      });

      animationFrameId = window.requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      window.cancelAnimationFrame(animationFrameId);
      // Aggressively free up Canvas/GPU memory
      if (canvas && ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        canvas.width = 0;
        canvas.height = 0;
      }
    };
  }, []);

  return (
    <div className="neurons-container">
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
    </div>
  );
};

const Landing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Mouse follower effect
  const [mousePosition, setMousePosition] = useState({ x: -1000, y: -1000 });
  
  // Intersection Observer for feature cards
  const featuresRef = useRef([]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, { threshold: 0.1 });

    featuresRef.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);


  const addToRefs = (el) => {
    if (el && !featuresRef.current.includes(el)) {
      featuresRef.current.push(el);
    }
  };

  return (
    <div className="landing-container">
      {/* Brain Neurons Transmitting Background */}
      <NeuronsAnimation />
      <div className="glow-orb glow-primary"></div>
      <div className="glow-orb glow-secondary"></div>
      <div className="glow-orb glow-tertiary"></div>
      
      {/* Interactive Mouse Glow */}
      <div 
        className="mouse-follower" 
        style={{ left: `${mousePosition.x}px`, top: `${mousePosition.y}px` }}
      ></div>

      <nav className="landing-nav">
        <div className="landing-logo">
          <Brain className="logo-icon" size={32} />
          <span>Synapse</span>
        </div>
        <div className="landing-nav-links">
          <a href="#features" className="nav-link">Platform</a>
          <a href="#features" className="nav-link">Solutions</a>
          {user ? (
            <button onClick={() => navigate('/dashboard')} className="btn-primary">
              Go to App <ArrowRight size={18} style={{ display: 'inline', marginLeft: '5px' }} />
            </button>
          ) : (
            <>
              <button onClick={() => navigate('/login')} className="btn-secondary">
                Log In
              </button>
              <button onClick={() => navigate('/register')} className="btn-primary">
                Get Started
              </button>
            </>
          )}
        </div>
      </nav>

      <section className="hero-section">

        <h1 className="hero-title">
          <span className="text-gradient">Connect Your Knowledge.</span><br />
          <span className="text-gradient-accent">Master Your Studies.</span>
        </h1>
        <p className="hero-subtitle">
          Synapse is an AI-powered workspace that unifies your notes, study planner, habits, and finances. Experience a second brain that works as fast as you do.
        </p>
        
        <div className="hero-actions">
          {user ? (
            <button onClick={() => navigate('/dashboard')} className="btn-primary" style={{ padding: '1.2rem 3rem', fontSize: '1.125rem' }}>
              Launch Synapse <Zap size={20} style={{ display: 'inline', marginLeft: '8px' }} />
            </button>
          ) : (
            <>
              <button onClick={() => navigate('/register')} className="btn-primary" style={{ padding: '1.2rem 3rem', fontSize: '1.125rem' }}>
                Start for Free <ArrowRight size={20} style={{ display: 'inline', marginLeft: '8px' }} />
              </button>
              <a href="#features" className="btn-secondary" style={{ padding: '1.2rem 3rem', fontSize: '1.125rem', display: 'flex', alignItems: 'center' }}>
                See how it works
              </a>
            </>
          )}
        </div>
        

      </section>


      <section id="features" className="features-container">
        <div className="features-header">
          <h2 className="text-gradient">Intelligent by Design</h2>
          <p className="hero-subtitle" style={{ marginBottom: '4rem' }}>
            Everything you need to excel, powered by cutting-edge AI.
          </p>
          
          {/* Zero Gravity Floating Brain System */}
          <ZeroGravityBrain />
        </div>
        
        <div className="features-grid">
          <div className="feature-card" ref={addToRefs}>
            <div className="feature-icon-wrapper">
              <BrainCircuit size={32} />
            </div>
            <h3 className="feature-title">AI Knowledge Engine</h3>
            <p className="feature-desc">
              Upload your documents and watch as Synapse instantly extracts key concepts, generates smart flashcards, and builds custom quizzes.
            </p>
          </div>
          
          <div className="feature-card" ref={addToRefs}>
            <div className="feature-icon-wrapper">
              <Calendar size={32} />
            </div>
            <h3 className="feature-title">Dynamic Study Planner</h3>
            <p className="feature-desc">
              Stop stressing over schedules. Our AI automatically optimizes your study sessions based on target exam dates and real-time progress.
            </p>
          </div>
          
          <div className="feature-card" ref={addToRefs}>
            <div className="feature-icon-wrapper">
              <BookOpen size={32} />
            </div>
            <h3 className="feature-title">Academics Hub</h3>
            <p className="feature-desc">
              A powerful Windows-style file explorer built natively into your browser. Organize subjects, track grades, and access materials instantly.
            </p>
          </div>
          
          <div className="feature-card" ref={addToRefs}>
            <div className="feature-icon-wrapper">
              <Target size={32} />
            </div>
            <h3 className="feature-title">Habit & Finance Tracker</h3>
            <p className="feature-desc">
              Build lasting routines with GitHub-style contribution graphs. Take control of your budget with automated finance analytics.
            </p>
          </div>

          <div className="feature-card" ref={addToRefs}>
            <div className="feature-icon-wrapper">
              <Briefcase size={32} />
            </div>
            <h3 className="feature-title">Secure Career Vault</h3>
            <p className="feature-desc">
              Store your certifications, internships, and projects in a session-locked vault. AI automatically extracts metadata to build your professional timeline.
            </p>
          </div>

          <div className="feature-card" ref={addToRefs}>
            <div className="feature-icon-wrapper">
              <FileText size={32} />
            </div>
            <h3 className="feature-title">AI Resume Builder</h3>
            <p className="feature-desc">
              Instantly generate tailored ATS-friendly resumes from your vault. Get AI-driven feedback to identify skill gaps and optimize for your target role.
            </p>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="cta-content" ref={addToRefs}>
          <h2 className="cta-title">Ready to <span>Upgrade</span> your brain?</h2>
          <p className="hero-subtitle">
            Join thousands of students who have transformed their academic journey with Synapse.
          </p>
          {user ? (
            <button onClick={() => navigate('/dashboard')} className="btn-primary" style={{ padding: '1.2rem 4rem', fontSize: '1.25rem' }}>
              Enter Workspace
            </button>
          ) : (
            <button onClick={() => navigate('/register')} className="btn-primary" style={{ padding: '1.2rem 4rem', fontSize: '1.25rem' }}>
              Create Free Account
            </button>
          )}
        </div>
      </section>
    </div>
  );
};

export default Landing;
