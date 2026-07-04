import React from 'react';

const steps = [
  { number: 1, label: 'URL Input',      icon: '🔗' },
  { number: 2, label: 'Transcription',  icon: '🎙️' },
  { number: 3, label: 'Summary',        icon: '✨' },
  { number: 4, label: 'Extraction',     icon: '📋' },
];

export default function StepIndicator({ currentStep, completedSteps }) {
  return (
    <div className="step-indicator">
      {steps.map((step) => {
        const isCompleted = completedSteps.includes(step.number);
        const isActive    = currentStep === step.number;

        return (
          <div
            key={step.number}
            className={`step-item ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}`}
          >
            <div className="step-circle">
              {isCompleted ? '✓' : step.icon}
            </div>
            <span className="step-label">{step.label}</span>
          </div>
        );
      })}
    </div>
  );
}
