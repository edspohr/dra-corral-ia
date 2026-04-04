import { useEffect, useRef, useCallback } from 'react';
import { useSimulator } from './hooks/useSimulator';
import { Header } from './components/layout/Header';
import { StepIndicator } from './components/ui/StepIndicator';
import { Step1Email } from './components/steps/Step1Email';
import { Step1Photo } from './components/steps/Step1Photo';
import { Step3Effect } from './components/steps/Step3Effect';
import { Step3Result } from './components/steps/Step3Result';

const STEP_LABELS = ['Email', 'Tu foto', 'Tratamiento', 'Resultado'];

function App() {
  const simulator = useSimulator();
  const { state } = simulator;

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
      {(state.step === 2 || state.step === 3) && (
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

      {/* Step 3: Zone + effect + intensity selection */}
      {state.step === 3 && (
        <Step3Effect
          selection={state.selection}
          photoPreviewUrl={state.photoPreviewUrl}
          onUpdateSelection={(sel) => simulator.setSelection(sel)}
          onComplete={() => simulator.goToStep(4)}
          onBack={() => simulator.goToStep(2)}
        />
      )}

      {/* Step 4: AI result */}
      {state.step === 4 && (
        <Step3Result
          originalPhotoUrl={state.photoPreviewUrl ?? ''}
          generatedImageUrl={state.generatedImageUrl}
          selection={state.selection!}
          isLoading={state.isLoading}
          error={state.error}
          email={state.email ?? ''}
          onRetry={handleRetry}
          onBack={() => simulator.goToStep(3)}
        />
      )}
    </div>
  );
}

export default App;
