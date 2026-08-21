import React from 'react';
import { formatDate, humanize, yesNo } from './reportUtils';

/**
 * PrintableAssessmentReport
 *
 * A plain, print-optimised rendering of the risk assessment, used only when
 * the user prints / saves the report as a PDF (window.print()). It is kept
 * completely separate from the interactive dashboard UI so the exported PDF
 * reads like a clinical document rather than a screenshot of the app:
 *  - no app chrome, gradients, tabs or collapsible accordions — everything
 *    relevant is laid out flat and fully expanded
 *  - no patient-identifying fields (name / age / gender) — only the clinical
 *    and lifestyle data actually used to produce the assessment
 *  - branded with the XoraScan mark instead of the interactive nav header
 *
 * `hidden print:block` keeps it out of the normal page flow and out of the
 * accessibility tree until the browser enters print mode.
 */
export default function PrintableAssessmentReport({
  assessment,
  riskReport,
  riskScore,
  riskLevel,
  urgency,
  carePlan,
  carePlanGroups,
  postValidation,
  safetyNotes,
  inconsistencies,
  ethics,
  inputSnapshot,
  sourceLabel,
}) {
  const mainRiskFactors = riskReport.main_risk_factors || [];
  const possibleConcerns = riskReport.possible_concerns || [];
  const riskReducingFactors = riskReport.risk_reducing_factors || [];
  const carePlanCategories = Object.entries(carePlanGroups || {});

  return (
    <div className="print-report hidden print:block bg-white text-slate-900 text-[12px] leading-relaxed">
      {/* ── Letterhead ─────────────────────────────────────────────── */}
      <div className="flex items-start justify-between pb-4 border-b-2 border-slate-900">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg" style={{ backgroundColor: '#0066FF' }}>
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18M3 12h18M12 7c-2.5 0-4.5 2-4.5 4.5S9.5 16 12 16s4.5-2 4.5-4.5S14.5 7 12 7z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9c-1.5 0-2.5 1-2.5 2.5S10.5 14 12 14s2.5-1 2.5-2.5S13.5 9 12 9z" />
            </svg>
          </div>
          <div>
            <p className="text-base font-bold tracking-tight">
              Xora<span style={{ color: '#0066FF' }}>Scan</span>
            </p>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Dental Risk Assessment Report</p>
          </div>
        </div>
        <div className="text-right text-[10px] text-slate-500 leading-snug">
          {assessment?.code && <p className="font-semibold text-slate-700">Report {assessment.code}</p>}
          <p>Date: {formatDate(assessment?.created_at)}</p>
          <p>Status: {sourceLabel}</p>
        </div>
      </div>

      <h1 className="text-lg font-bold mt-4">{riskReport.title || 'Dental Risk Assessment'}</h1>

      {/* ── Risk overview ──────────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-3 mt-3 print-avoid-break">
        <FactBlock label="Risk Level" value={humanize(riskLevel)} />
        <FactBlock label="Risk Score" value={riskScore != null ? `${Math.round(riskScore)} / 100` : '—'} />
        <FactBlock label="Detected Condition" value={humanize(inputSnapshot.identified_disease)} />
        <FactBlock label="X-Ray Severity" value={humanize(inputSnapshot.disease_severity_from_xray)} />
      </div>
      {carePlan.dentist_urgency && (
        <div className="mt-3 print-avoid-break">
          <FactBlock label="Recommended Dentist Visit" value={urgency.text} />
        </div>
      )}

      {/* ── Summary ────────────────────────────────────────────────── */}
      {(riskReport.summary || riskReport.risk_level_text || riskReport.risk_score_text) && (
        <Section title="Assessment Summary">
          {riskReport.summary && <p>{riskReport.summary}</p>}
          {riskReport.risk_level_text && (
            <p className="mt-2"><span className="font-semibold">Risk level: </span>{riskReport.risk_level_text}</p>
          )}
          {riskReport.risk_score_text && (
            <p className="mt-2"><span className="font-semibold">Risk score: </span>{riskReport.risk_score_text}</p>
          )}
        </Section>
      )}

      {/* ── Risk factor breakdown ──────────────────────────────────── */}
      {(mainRiskFactors.length > 0 || possibleConcerns.length > 0 || riskReducingFactors.length > 0) && (
        <Section title="Risk Factor Breakdown">
          {mainRiskFactors.length > 0 && (
            <SubSection title="Main Risk Factors">
              <BulletList items={mainRiskFactors} />
            </SubSection>
          )}
          {possibleConcerns.length > 0 && (
            <SubSection title="Possible Concerns (not a confirmed diagnosis)">
              <BulletList items={possibleConcerns} />
            </SubSection>
          )}
          {riskReducingFactors.length > 0 && (
            <SubSection title="Risk-Reducing Factors">
              <BulletList items={riskReducingFactors} />
            </SubSection>
          )}
        </Section>
      )}

      {/* ── Care plan ──────────────────────────────────────────────── */}
      {carePlanCategories.length > 0 && (
        <Section title="Personalised Care Plan">
          {carePlanCategories.map(([cat, items]) => (
            <SubSection key={cat} title={cat}>
              {items.map((item, idx) => (
                <div key={idx} className="mb-2.5 last:mb-0 print-avoid-break">
                  <p className="font-semibold">{item.title || humanize(item.key)}</p>
                  {item.selected_value && (
                    <p className="text-[11px] text-slate-600">Recommendation: {humanize(item.selected_value)}</p>
                  )}
                  {item.detailed_explanation && <p className="mt-0.5">{item.detailed_explanation}</p>}
                  {item.safety_note && (
                    <p className="mt-0.5 text-[11px] italic text-slate-600">Note: {item.safety_note}</p>
                  )}
                </div>
              ))}
            </SubSection>
          ))}
        </Section>
      )}

      {/* ── Safety validation ──────────────────────────────────────── */}
      <Section title="Safety Validation">
        {postValidation.status === 'passed' ? (
          <p>This report passed the system's post-generation consistency and safety checks.</p>
        ) : postValidation.status ? (
          <p>Validation status: {postValidation.status}</p>
        ) : (
          <p className="text-slate-500">No validation data available.</p>
        )}
        {safetyNotes.length > 0 && (
          <SubSection title="Safety Notes">
            <BulletList items={safetyNotes} />
          </SubSection>
        )}
        {inconsistencies.length > 0 && (
          <SubSection title="Inconsistencies Detected">
            <BulletList items={inconsistencies} />
          </SubSection>
        )}
      </Section>

      {/* ── Clinical & lifestyle profile used (no name / age / gender) ─ */}
      <Section title="Clinical & Lifestyle Data Used In This Assessment">
        <div className="grid grid-cols-2 gap-x-8 gap-y-1">
          <DataRow label="Number of Teeth" value={inputSnapshot.number_of_teeth} />
          <DataRow label="Missing Teeth" value={inputSnapshot.number_of_missing_teeth} />
          <DataRow label="Filled Teeth" value={inputSnapshot.number_of_filled_teeth} />
          <DataRow label="Affected Teeth" value={inputSnapshot.affected_teeth_count} />
          <DataRow label="Primary Teeth" value={yesNo(inputSnapshot.is_primary_teeth)} />
          <DataRow label="Gum Bleeding" value={yesNo(inputSnapshot.gum_bleeding)} />
          <DataRow label="Tooth Sensitivity" value={yesNo(inputSnapshot.tooth_sensitivity)} />
          <DataRow
            label="Brushing Frequency"
            value={
              inputSnapshot.brushing_frequency === 0
                ? 'Rarely'
                : inputSnapshot.brushing_frequency === 1
                  ? 'Once per day'
                  : 'Twice or more'
            }
          />
          <DataRow label="Oral Hygiene Level" value={humanize(inputSnapshot.overall_oral_hygiene_level)} />
          <DataRow label="Smoking" value={humanize(inputSnapshot.smoking_status)} />
          <DataRow label="Alcohol Usage" value={humanize(inputSnapshot.alcohol_usage)} />
          <DataRow label="Sugar Intake" value={humanize(inputSnapshot.sugar_usage)} />
          <DataRow label="Diabetes" value={yesNo(inputSnapshot.diabetes_status)} />
          <DataRow label="Pregnancy" value={yesNo(inputSnapshot.pregnancy_status)} />
          <DataRow label="Calcium/Vitamin Deficiency" value={yesNo(inputSnapshot.calcium_or_vitamin_deficiency)} />
        </div>
      </Section>

      {/* ── Disclaimers ────────────────────────────────────────────── */}
      {(ethics.main_disclaimer || ethics.research_context || ethics.medication_disclaimer || ethics.professional_care_disclaimer) && (
        <Section title="Disclaimers">
          {ethics.main_disclaimer && <p>{ethics.main_disclaimer}</p>}
          {ethics.research_context && <p className="mt-2">{ethics.research_context}</p>}
          {ethics.medication_disclaimer && <p className="mt-2">{ethics.medication_disclaimer}</p>}
          {ethics.professional_care_disclaimer && <p className="mt-2">{ethics.professional_care_disclaimer}</p>}
        </Section>
      )}

      <div className="mt-6 pt-3 border-t border-slate-300 text-[10px] text-slate-500 text-center">
        Generated by XoraScan's AI-ML assisted dental risk-assessment pipeline. For clinical reference only —
        does not replace an in-person dental examination or professional diagnosis.
      </div>
    </div>
  );
}

/* ── Print-only sub-components ─────────────────────────────────────── */
function Section({ title, children }) {
  return (
    <div className="mt-5 print-avoid-break">
      <h2 className="text-[11px] font-bold uppercase tracking-wider border-b border-slate-300 pb-1 mb-2">{title}</h2>
      {children}
    </div>
  );
}

function SubSection({ title, children }) {
  return (
    <div className="mt-3 first:mt-0">
      <p className="text-[11px] font-semibold text-slate-700 mb-1">{title}</p>
      {children}
    </div>
  );
}

function BulletList({ items }) {
  return (
    <ul className="list-disc pl-4 space-y-0.5">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

function FactBlock({ label, value }) {
  return (
    <div>
      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">{label}</p>
      <p className="text-[13px] font-bold">{value || '—'}</p>
    </div>
  );
}

function DataRow({ label, value }) {
  return (
    <div className="flex justify-between border-b border-slate-100 py-0.5">
      <span className="text-slate-500">{label}</span>
      <span className="font-semibold">{value ?? '—'}</span>
    </div>
  );
}
