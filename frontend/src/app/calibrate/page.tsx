import CalibrationWizard from "@/components/CalibrationWizard";

export const metadata = {
  title: "Calibrate — PKE",
  description:
    "Record baseline exercise sequences to create your personalized biomechanical profile for form evaluation.",
};

export default function CalibratePage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--pke-text-primary)] tracking-tight">
          Calibration
        </h1>
        <p className="text-sm text-[var(--pke-text-secondary)] mt-1">
          Record 3–5 sequences of correct form to create your personal baseline.
          The system learns <em>your</em> biomechanics — not a generic standard.
        </p>
      </div>

      {/* Info */}
      <div className="pke-card p-4 flex items-start gap-3 border-l-4 border-l-[var(--pke-accent)]">
        <span className="text-lg">🧬</span>
        <div>
          <p className="text-sm font-medium text-[var(--pke-text-primary)]">
            Why Calibrate?
          </p>
          <p className="text-xs text-[var(--pke-text-secondary)] mt-0.5 leading-relaxed">
            PKE uses a User-Calibrated Siamese Network rather than comparing
            you to a universal expert. Your calibration data fine-tunes the
            model's projection layers to map your unique movement patterns,
            ensuring fair evaluation regardless of body type or flexibility.
          </p>
        </div>
      </div>

      {/* Wizard */}
      <CalibrationWizard />
    </div>
  );
}
