'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Clock,
  Briefcase,
  Users,
  HeartPulse,
  Gem,
  ArrowRight,
  RotateCcw,
  Check,
  TrendingDown,
  ShieldCheck,
  Info
} from 'lucide-react';
import { DisclaimerModal } from '@/components/DisclaimerModal';

interface CostItem {
  id: string;
  title: string;
  description: string;
  weeklyHours: number;
  financialImpactKES: number;
  icon: any;
  category: string;
  breakdown: string;
}

const COST_ITEMS: CostItem[] = [
  {
    id: 'time_energy',
    title: 'Lost Time & Energy',
    description: 'Hours each week spent managing anxiety, second-guessing yourself, or feeling numb.',
    weeklyHours: 7,
    financialImpactKES: 65000,
    icon: Clock,
    category: 'Mental Bandwidth',
    breakdown: 'Over 360 hours annually drained in mental loops and emotional fatigue.'
  },
  {
    id: 'missed_opps',
    title: 'Missed Opportunities',
    description: "Projects, promotions, or relationships you've held back from because you didn't trust yourself.",
    weeklyHours: 4,
    financialImpactKES: 180000,
    icon: Briefcase,
    category: 'Career & Wealth',
    breakdown: 'Stalled salary raises, unpitched creative ideas, and holding back from high-value roles.'
  },
  {
    id: 'relationship_strain',
    title: 'Relationship Strain',
    description: "Distance from people who matter because you can't show up authentically.",
    weeklyHours: 3,
    financialImpactKES: 40000,
    icon: Users,
    category: 'Connection',
    breakdown: 'Withholding your truth, emotional withdrawal, and carrying unspoken resentments.'
  },
  {
    id: 'health_wellbeing',
    title: 'Health & Wellbeing',
    description: 'Physical or mental health impacts from chronic stress and disconnection.',
    weeklyHours: 4,
    financialImpactKES: 85000,
    icon: HeartPulse,
    category: 'Vitality',
    breakdown: 'Tension, compromised sleep patterns, and physical symptoms of persistent chronic stress.'
  },
  {
    id: 'peace_of_mind',
    title: 'Peace of Mind',
    description: 'What would it be worth to wake up feeling truly at ease with who you are?',
    weeklyHours: 5,
    financialImpactKES: 120000,
    icon: Gem,
    category: 'Sovereignty',
    breakdown: 'Living in perpetual defense mode instead of serene, grounded confidence and alignment.'
  }
];

export function HiddenCostCalculator() {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [validationError, setValidationError] = useState('');

  const toggleItem = (id: string) => {
    setValidationError('');
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleClear = () => {
    setSelectedIds([]);
    setShowResults(false);
    setValidationError('');
  };

  const handleCalculate = () => {
    if (selectedIds.length === 0) {
      setValidationError('Please select at least one item that resonates with you to calculate your hidden cost.');
      setShowResults(false);
      return;
    }
    setValidationError('');
    setShowResults(true);
  };

  // Calculated aggregations
  const selectedItems = COST_ITEMS.filter((item) => selectedIds.includes(item.id));
  const totalWeeklyHours = selectedItems.reduce((acc, curr) => acc + curr.weeklyHours, 0);
  const totalAnnualHours = totalWeeklyHours * 52;
  const estimatedAnnualValueKES = selectedItems.reduce((acc, curr) => acc + curr.financialImpactKES, 0);

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-white rounded-3xl border border-stone-200 shadow-xl overflow-hidden p-6 sm:p-10 space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-stone-900 tracking-tight">
            Calculate Your Hidden Cost
          </h2>
          <p className="text-stone-600 text-xs sm:text-sm leading-relaxed">
            Select what resonates with you, then see what staying stuck might cost.
          </p>
        </div>

        {/* Checkbox Options */}
        <div className="space-y-4 pt-1">
          {COST_ITEMS.map((item) => {
            const isSelected = selectedIds.includes(item.id);
            return (
              <div
                key={item.id}
                onClick={() => toggleItem(item.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer select-none flex items-start gap-4 ${
                  isSelected
                    ? 'bg-rose-50/40 border-rose-900/30 shadow-xs'
                    : 'bg-stone-50/60 border-stone-200/90 hover:border-stone-300 hover:bg-stone-50'
                }`}
              >
                {/* Custom Checkbox */}
                <div
                  className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                    isSelected
                      ? 'bg-rose-950 text-amber-100'
                      : 'border-2 border-stone-300 bg-white'
                  }`}
                >
                  {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                </div>

                <div className="space-y-1 flex-1">
                  <h3 className="font-serif text-sm sm:text-base font-semibold text-stone-900 leading-snug">
                    {item.title}
                  </h3>
                  <p className="text-xs text-stone-600 leading-relaxed font-sans">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Validation warning */}
        {validationError && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center gap-2">
            <Info className="w-4 h-4 text-rose-700 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        {/* Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            onClick={handleCalculate}
            className="w-full py-3.5 px-6 rounded-2xl bg-stone-900 hover:bg-rose-950 text-amber-50 font-medium text-sm transition shadow flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>See My Cost</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleClear}
            className="w-full py-3.5 px-6 rounded-2xl border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 font-medium text-sm transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            <RotateCcw className="w-4 h-4 text-stone-500" />
            <span>Clear</span>
          </button>
        </div>

        {/* Calculated Results Display */}
        {showResults && (
          <div className="pt-6 border-t border-stone-200 space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="p-6 rounded-2xl bg-gradient-to-br from-stone-900 via-rose-950 to-stone-900 text-amber-50 space-y-5 shadow-lg">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-rose-400" />
                  <span className="text-xs uppercase tracking-wider font-semibold text-rose-300">
                    The Reality of Staying Where You Are
                  </span>
                </div>
                <span className="text-[11px] bg-rose-900/60 px-2.5 py-0.5 rounded-full border border-rose-700/50 text-amber-200">
                  {selectedItems.length} Areas Selected
                </span>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white/10 p-4 rounded-xl backdrop-blur-xs border border-white/10 space-y-1">
                  <span className="text-[11px] text-stone-300 block">Weekly Time Drain</span>
                  <div className="font-serif text-3xl font-bold text-amber-200">
                    ~{totalWeeklyHours} Hours <span className="text-xs font-sans font-normal text-stone-300">/ week</span>
                  </div>
                  <p className="text-[11px] text-stone-300">
                    Equivalent to <strong>~{totalAnnualHours.toLocaleString()} hours</strong> lost every year to hesitation & fatigue.
                  </p>
                </div>

                <div className="bg-white/10 p-4 rounded-xl backdrop-blur-xs border border-white/10 space-y-1">
                  <span className="text-[11px] text-stone-300 block">Estimated Opportunity & Vitality Cost</span>
                  <div className="font-serif text-3xl font-bold text-amber-200">
                    KES {estimatedAnnualValueKES.toLocaleString()}
                  </div>
                  <p className="text-[11px] text-stone-300">
                    In stalled career velocity, emotional friction, and depleted peace of mind.
                  </p>
                </div>
              </div>

              {/* Selected Area Insights */}
              <div className="space-y-2 pt-1">
                <span className="text-xs font-semibold text-amber-100 block">
                  Your Compounding Hidden Drains:
                </span>
                <div className="space-y-1.5 text-xs text-stone-200">
                  {selectedItems.map((item) => (
                    <div key={item.id} className="flex items-start gap-2">
                      <span className="text-rose-400 font-bold">•</span>
                      <span>
                        <strong className="text-amber-100">{item.title}:</strong> {item.breakdown}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* The Contrast / Invitation */}
              <div className="p-4 rounded-xl bg-white/10 border border-amber-300/30 space-y-2">
                <h4 className="font-serif text-sm font-semibold text-amber-100 flex items-center gap-1.5">
                  <Gem className="w-3.5 h-3.5 text-amber-300" />
                  <span>The Becoming Her Breakthrough Alternative</span>
                </h4>
                <p className="text-xs text-stone-200 leading-relaxed">
                  Remaining stuck isn't free—it costs you your peace, your vitality, and your sovereign trajectory. 
                  Our structured coaching containers begin from just <strong>KES 1,000</strong>, guiding you through proven reflection frameworks and lasting habit transformation.
                </p>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                <Link
                  href="#services"
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-amber-100 text-stone-950 text-xs font-semibold hover:bg-white transition shadow text-center"
                >
                  Explore Coaching Pathways →
                </Link>
                <Link
                  href="/services/interpersonal-coaching"
                  className="w-full sm:w-auto px-6 py-3 rounded-xl border border-white/20 text-amber-50 text-xs font-semibold hover:bg-white/10 transition text-center"
                >
                  Book 1-on-1 Guidance
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Sub-card Disclaimer Notice */}
        <div className="pt-4 border-t border-stone-100 flex flex-col sm:flex-row items-center justify-between text-[11px] text-stone-500 gap-2">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-rose-800 shrink-0" />
            <span>Becoming Her is coaching and personal development — NOT therapy or counselling.</span>
          </div>
          <DisclaimerModal triggerText="Read full disclaimer" />
        </div>
      </div>
    </div>
  );
}
