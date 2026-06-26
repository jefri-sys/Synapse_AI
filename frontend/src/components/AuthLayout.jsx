import React from 'react';
import { Link } from 'react-router-dom';
import { Brain } from 'lucide-react';
import { SplineScene } from './ui/splite.jsx';
import { Card } from './ui/card.jsx';
import { Spotlight } from './ui/spotlight.jsx';
import ErrorBoundary from './ErrorBoundary.jsx';
import './AuthLayout.css';

function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="min-h-screen bg-[var(--marketing-bg-base)] flex items-center justify-center p-4 sm:p-8">
      <Card className="w-full max-w-[1200px] min-h-[600px] bg-black/[0.96] relative overflow-hidden border-[var(--marketing-text-secondary)]/20 shadow-2xl rounded-2xl">
        <Spotlight
          className="-top-40 left-0 md:left-60 md:-top-20"
          fill="var(--marketing-white)"
        />
        
        <div className="flex flex-col md:flex-row h-full min-h-[600px]">
          {/* Left content - Login Form */}
          <div className="flex-1 p-8 md:p-12 lg:p-16 relative z-10 flex flex-col justify-center bg-transparent">
            <Link to="/" className="flex items-center gap-3 mb-10 text-white no-underline transition-opacity hover:opacity-80">
              <Brain className="text-[var(--marketing-text-secondary)]" size={32} />
              <span className="text-2xl font-bold tracking-tight">Synapse</span>
            </Link>

            <div className="mb-10">
              <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-neutral-50 to-neutral-400 mb-4">
                {title}
              </h1>
              {subtitle && (
                <p className="text-[var(--marketing-text-tertiary)] text-sm max-w-sm leading-relaxed">
                  {subtitle}
                </p>
              )}
            </div>

            <div className="w-full max-w-sm">
              {children}
            </div>

            {footer && (
              <div className="mt-8 pt-6 border-t border-white/10 text-sm text-[var(--marketing-text-tertiary)]">
                {footer}
              </div>
            )}
          </div>

          {/* Right content - Interactive 3D Spline Scene */}
          <div className="hidden md:flex flex-1 relative bg-transparent min-h-full items-center justify-center overflow-hidden">
            <ErrorBoundary fallback={
              <div className="w-full h-full flex flex-col items-center justify-center text-[var(--marketing-text-tertiary)]/70">
                <Brain className="animate-pulse mb-4 opacity-20" size={64} />
                <p className="text-sm opacity-50">3D Background unavailable</p>
              </div>
            }>
              <SplineScene 
                scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
                className="w-full h-full"
              />
            </ErrorBoundary>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default AuthLayout;
