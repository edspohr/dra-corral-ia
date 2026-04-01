import { useEffect, useRef, useCallback } from 'react';
import { useSimulator } from './hooks/useSimulator';
import { Header } from './components/layout/Header';
import { StepIndicator } from './components/ui/StepIndicator';
import { Step1Email } from './components/steps/Step1Email';
import { Step1Photo } from './components/steps/Step1Photo';
import { Step2Procedures } from './components/steps/Step2Procedures';
import { Step3Result } from './components/steps/Step3Result';
import { Step4Lead } from './components/steps/Step4Lead';

const STEP_LABELS = ['Datos', 'Tu foto', 'Tratamientos', 'Resultado', 'Agenda'];

function App() {
  const simulator = useSimulator();
  const { state, enabledProcedures } = simulator;

  // Trigger generation exactly once when we land on step 4 without a result
  const hasFiredRef = useRef(false);
  useEffect(() => {
    if (state.step === 4 && !state.generatedImageUrl && !state.isLoading && !hasFiredRef.current) {
      hasFiredRef.current = true;
      simulator.generateImage();
    }
    if (state.step !== 4) {
      hasFiredRef.current = false; // reset so it fires again on re-entry
    }
  }, [state.step, state.generatedImageUrl, state.isLoading, simulator]);

  const handleRetry = useCallback(() => {
    hasFiredRef.current = false;
    simulator.generateImage();
  }, [simulator]);

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: 'var(--cream)' }}
    >
      {/* Header: hidden on step 1 — email gate has its own hero header */}
      {state.step !== 1 && <Header />}

      {/* Step indicator: shown on steps 2 and 3 only */}
      {state.step !== 1 && state.step !== 4 && state.step !== 5 && (
        <StepIndicator currentStep={state.step} labels={STEP_LABELS} />
      )}

      {/* Step 1: Email gate */}
      {state.step === 1 && (
        <Step1Email onComplete={(email) => simulator.setEmail(email)} />
      )}

      {/* Step 2: Photo upload */}
      {state.step === 2 && (
        <Step1Photo
          initialPreviewUrl={state.photoPreviewUrl}
          onComplete={(file, previewUrl) => {
            simulator.setPhoto(file, previewUrl);
            simulator.goToStep(3);
          }}
        />
      )}

      {/* Step 3: Procedure selection */}
      {state.step === 3 && (
        <Step2Procedures
          procedures={state.procedures}
          photoPreviewUrl={state.photoPreviewUrl}
          onUpdateProcedure={simulator.updateProcedure}
          onComplete={() => simulator.goToStep(4)}
          onBack={() => simulator.goToStep(2)}
        />
      )}

      {/* Step 4: AI result */}
      {state.step === 4 && (
        <Step3Result
          originalPhotoUrl={state.photoPreviewUrl ?? ''}
          generatedImageUrl={state.generatedImageUrl}
          selectedProcedures={enabledProcedures}
          isLoading={state.isLoading}
          error={state.error}
          onRetry={handleRetry}
          onContinue={() => simulator.goToStep(5)}
          onBack={() => simulator.goToStep(3)}
        />
      )}

      {/* Step 5: Lead capture + discount code */}
      {state.step === 5 && (
        <Step4Lead
          email={state.email ?? ''}
          sessionId={state.sessionId ?? crypto.randomUUID()}
          procedures={enabledProcedures.map((p) => p.id)}
          onComplete={(code) => simulator.setLeadCode(code)}
          onBack={() => simulator.goToStep(4)}
        />
      )}
    </div>
  );
}

export default App;
