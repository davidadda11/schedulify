// src/lib/utils/scheduler.ts
// AI Schedule Generator — Pomodoro + Spaced Repetition + SM-2
// Generates an optimized weekly study schedule

export interface AvailabilitySlot {
  dayOfWeek:  number;    // 0=Mon … 6=Sun
  startHour:  number;    // 14.0 = 14:00
  endHour:    number;
  type:       'free' | 'school' | 'activity';
}

export interface SubjectInput {
  id:           string;
  name:         string;
  priority:     number;   // 1-5
  difficulty:   number;   // 1-5
  hoursPerWeek: number;   // desired hours per week
  lastStudied?: Date;     // for spaced repetition
  easeFactor?:  number;   // SM-2 ease factor (default 2.5)
}

export interface StudyBlock {
  subjectId:   string;
  dayOfWeek:   number;
  startHour:   number;
  endHour:     number;
  technique:   'pomodoro' | 'deep' | 'review';
  pomodoroCount?: number;
}

export interface ScheduleResult {
  blocks:    StudyBlock[];
  weeklyMin: Record<string, number>;
  warnings:  string[];
}

// ── Pomodoro configuration ───────────────────────────────────
const POMODORO = {
  workMin:  25,
  shortMin: 5,
  longMin:  15,
  setSize:  4,   // pomodoros before long break
};

// ── SM-2 Spaced Repetition ───────────────────────────────────
export function calcNextReview(
  easeFactor: number,
  interval: number,
  quality: number    // 0-5 (recall quality)
): { newInterval: number; newEF: number } {
  // SM-2 algorithm
  const newEF = Math.max(
    1.3,
    easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  );

  let newInterval: number;
  if (quality < 3) {
    newInterval = 1;               // reset on failure
  } else if (interval === 0) {
    newInterval = 1;
  } else if (interval === 1) {
    newInterval = 6;
  } else {
    newInterval = Math.round(interval * newEF);
  }

  return { newInterval, newEF };
}

// ── Priority score for sorting ──────────────────────────────
function urgencyScore(subject: SubjectInput): number {
  const daysNotStudied = subject.lastStudied
    ? (Date.now() - subject.lastStudied.getTime()) / 86_400_000
    : 14;

  const ef        = subject.easeFactor ?? 2.5;
  const staleness = Math.min(daysNotStudied / 7, 3);  // max weight 3
  const diffWeight = subject.difficulty / 5;

  return (subject.priority * 2) + (staleness * 1.5) + (diffWeight * 1.2) + (1 / ef);
}

// ── Main Schedule Generator ──────────────────────────────────
export function generateWeeklySchedule(
  subjects:     SubjectInput[],
  availability: AvailabilitySlot[],
  options: {
    technique?: 'pomodoro' | 'deep' | 'mixed';
    preferMorning?: boolean;
  } = {}
): ScheduleResult {
  const { technique = 'mixed', preferMorning = false } = options;
  const blocks:   StudyBlock[]          = [];
  const weeklyMin: Record<string, number> = {};
  const warnings: string[]              = [];

  subjects.forEach(s => { weeklyMin[s.id] = 0; });

  // Sort subjects by urgency
  const sorted = [...subjects].sort((a, b) => urgencyScore(b) - urgencyScore(a));

  // Build a time grid: day → hour slots (30-min resolution)
  const freeSlots = availability
    .filter(s => s.type === 'free')
    .sort((a, b) => {
      if (preferMorning) return a.startHour - b.startHour;
      return b.startHour - a.startHour;
    });

  // Track used time per slot
  const usedMap = new Map<string, number>();  // "day-startHour" → usedHours

  function getAvailableHours(slot: AvailabilitySlot): number {
    const key  = `${slot.dayOfWeek}-${slot.startHour}`;
    const used = usedMap.get(key) ?? 0;
    return (slot.endHour - slot.startHour) - used;
  }

  function useTime(slot: AvailabilitySlot, hours: number) {
    const key  = `${slot.dayOfWeek}-${slot.startHour}`;
    const used = usedMap.get(key) ?? 0;
    usedMap.set(key, used + hours);
  }

  // Allocate study time for each subject
  for (const subject of sorted) {
    let remainingHours = subject.hoursPerWeek;

    for (const slot of freeSlots) {
      if (remainingHours <= 0) break;

      const available = getAvailableHours(slot);
      if (available < 0.5) continue;  // need at least 30 min

      // Decide technique & duration
      const blockHours = Math.min(
        remainingHours,
        available,
        technique === 'deep' ? 2 : 1.5   // max block size
      );

      // Pomodoro quantization (round to 25-min units)
      const pomodoroBlocks = Math.max(1, Math.floor((blockHours * 60) / (POMODORO.workMin + POMODORO.shortMin)));
      const actualHours    = (pomodoroBlocks * (POMODORO.workMin + POMODORO.shortMin)) / 60;

      const used       = usedMap.get(`${slot.dayOfWeek}-${slot.startHour}`) ?? 0;
      const blockStart = slot.startHour + used;
      const blockEnd   = blockStart + actualHours;

      if (blockEnd > slot.endHour) continue;

      const chosenTechnique = technique === 'mixed'
        ? (subject.difficulty >= 4 ? 'deep' : 'pomodoro')
        : technique;

      blocks.push({
        subjectId:      subject.id,
        dayOfWeek:      slot.dayOfWeek,
        startHour:      blockStart,
        endHour:        blockEnd,
        technique:      chosenTechnique as StudyBlock['technique'],
        pomodoroCount:  chosenTechnique === 'pomodoro' ? pomodoroBlocks : undefined,
      });

      useTime(slot, actualHours);
      remainingHours       -= actualHours;
      weeklyMin[subject.id] = (weeklyMin[subject.id] ?? 0) + actualHours * 60;
    }

    if (remainingHours > 0.1) {
      warnings.push(
        `Nu există suficient timp disponibil pentru "${subject.name}". ` +
        `Lipsesc ~${Math.round(remainingHours * 60)} minute/săptămână.`
      );
    }
  }

  return { blocks, weeklyMin, warnings };
}

// ── Format hour helper ───────────────────────────────────────
export function formatHour(h: number): string {
  const hours   = Math.floor(h);
  const minutes = Math.round((h - hours) * 60);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}