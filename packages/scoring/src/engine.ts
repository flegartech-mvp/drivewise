import { DrivingEventType, EventSeverity, SpeedLimitConfidence } from '@drivewise/shared';
import { isNightTime } from '@drivewise/shared';
import {
  ScoringInput, ScoreResult, ScorePenalty, ScoreBonus,
  EventSummary, ConfidenceSummary, DriverLevel,
} from './types';

const DRIVER_LEVELS = [
  { tier: 'PLATINUM' as const, label: 'Platinum', labelSl: 'Platinast', minScore: 95, maxScore: 100, emoji: '💎', color: '#e5e4e2', nextTier: undefined, nextMinScore: undefined },
  { tier: 'GOLD' as const, label: 'Gold', labelSl: 'Zlatast', minScore: 85, maxScore: 94, emoji: '🥇', color: '#ffd700', nextTier: 'Platinast', nextMinScore: 95 },
  { tier: 'SILVER' as const, label: 'Silver', labelSl: 'Srebrn', minScore: 70, maxScore: 84, emoji: '🥈', color: '#c0c0c0', nextTier: 'Zlatast', nextMinScore: 85 },
  { tier: 'BRONZE' as const, label: 'Bronze', labelSl: 'Bronast', minScore: 0, maxScore: 69, emoji: '🥉', color: '#cd7f32', nextTier: 'Srebrn', nextMinScore: 70 },
];

function computeDriverLevel(score: number): DriverLevel {
  const level = DRIVER_LEVELS.find((l) => score >= l.minScore) ?? DRIVER_LEVELS[DRIVER_LEVELS.length - 1];
  const range = level.maxScore - level.minScore;
  const progress = range > 0 ? Math.round(((score - level.minScore) / range) * 100) : 100;
  return {
    tier: level.tier,
    label: level.label,
    labelSl: level.labelSl,
    minScore: level.minScore,
    maxScore: level.maxScore,
    emoji: level.emoji,
    color: level.color,
    progressToNext: Math.min(100, Math.max(0, progress)),
    nextTier: level.nextTier,
    nextMinScore: level.nextMinScore,
  };
}

function buildRecommendations(
  penalties: ScorePenalty[],
  eventSummary: EventSummary,
  finalScore: number,
): { recommendations: string[]; topWeaknesses: string[]; topStrengths: string[] } {
  const recommendations: string[] = [];
  const weaknesses: string[] = [];
  const strengths: string[] = [];

  const sorted = [...penalties].sort((a, b) => b.points - a.points);
  const topPenalties = sorted.slice(0, 3);

  for (const p of topPenalties) {
    switch (p.eventType) {
      case DrivingEventType.SPEEDING:
        weaknesses.push(`Prekoračitev hitrosti (${p.count}× zaznano, -${p.points} točk)`);
        recommendations.push('Prilagodite hitrost cestnoprometnim predpisom in razmeram na cesti.');
        break;
      case DrivingEventType.HARSH_BRAKING:
        weaknesses.push(`Sunkovito zaviranje (${p.count}× zaznano, -${p.points} točk)`);
        recommendations.push('Povečajte varnostno razdaljo in pričnite zavirati pravočasno.');
        break;
      case DrivingEventType.HARSH_ACCELERATION:
        weaknesses.push(`Sunkovito pospeševanje (${p.count}× zaznano, -${p.points} točk)`);
        recommendations.push('Postopno pospeševajte in se izogibajte nenadnim speljavam.');
        break;
      case DrivingEventType.SHARP_CORNERING:
        weaknesses.push(`Ostra kornering (${p.count}× zaznano, -${p.points} točk)`);
        recommendations.push('Pred ovinki upočasnite in se izogibajte nenadnim premikanjem volana.');
        break;
      case DrivingEventType.PHONE_MOVEMENT:
        weaknesses.push(`Možna uporaba telefona (${p.count}× zaznano, -${p.points} točk)`);
        recommendations.push('Ne upravljajte s telefonom med vožnjo – uporabite prostoročno napravo.');
        break;
      case DrivingEventType.NIGHT_DRIVING:
        weaknesses.push('Nočna vožnja (kontekstualni modifier)');
        recommendations.push('Pri nočni vožnji zmanjšajte hitrost in povečajte varnostno razdaljo.');
        break;
    }
  }

  if (finalScore >= 90) strengths.push('Odlična skupna ocena vožnje');
  if (eventSummary.byType[DrivingEventType.SPEEDING] === undefined) strengths.push('Brez prekoračitev hitrosti');
  if (eventSummary.byType[DrivingEventType.PHONE_MOVEMENT] === undefined) strengths.push('Brez uporabe telefona med vožnjo');
  if (eventSummary.byType[DrivingEventType.HARSH_BRAKING] === undefined) strengths.push('Brez sunkovitega zaviranja');
  if (eventSummary.byType[DrivingEventType.HARSH_ACCELERATION] === undefined) strengths.push('Brez sunkovitega pospeševanja');
  if (eventSummary.totalEvents === 0) strengths.push('Popolnoma varnostna vožnja brez tveganih dogodkov');

  return {
    recommendations: recommendations.slice(0, 3),
    topWeaknesses: weaknesses.slice(0, 3),
    topStrengths: strengths.slice(0, 3),
  };
}

const BASE_SCORE = 100;
const MIN_SCORE = 0;
const MAX_SCORE = 100;

/** Minimum trip distance to apply full penalty weight */
const MIN_DISTANCE_FOR_FULL_PENALTY = 2;

export function calculateScore(input: ScoringInput): ScoreResult {
  const penalties: ScorePenalty[] = [];
  const bonuses: ScoreBonus[] = [];
  const warnings: string[] = [];

  const distanceFactor = Math.min(
    1,
    input.distanceKm / MIN_DISTANCE_FOR_FULL_PENALTY,
  );

  const eventCounts = countEventsByType(input.events);
  const eventSummary = buildEventSummary(input.events);
  const confidenceSummary = buildConfidenceSummary(input.events);

  // ── Speeding penalties ──────────────────────────────────────────────────
  const speedingEvents = input.events.filter(
    (e) => e.type === DrivingEventType.SPEEDING,
  );

  const highConfidenceSpeeding = speedingEvents.filter(
    (e) => e.speedLimitConfidence === SpeedLimitConfidence.HIGH ||
           e.speedLimitConfidence === SpeedLimitConfidence.MEDIUM,
  );

  const lowConfidenceSpeeding = speedingEvents.filter(
    (e) => !e.speedLimitConfidence ||
           e.speedLimitConfidence === SpeedLimitConfidence.LOW ||
           e.speedLimitConfidence === SpeedLimitConfidence.UNKNOWN,
  );

  if (lowConfidenceSpeeding.length > 0) {
    warnings.push(
      `${lowConfidenceSpeeding.length} speeding event(s) detected with low/unknown speed-limit confidence — not penalized.`,
    );
  }

  if (confidenceSummary.speedLimitUnavailableCount > 0) {
    warnings.push(
      `Speed limit data was unavailable for ${confidenceSummary.speedLimitUnavailableCount} road segment(s). Estimated values used where possible.`,
    );
  }

  // Group high-confidence speeding by severity
  const speedingLow = highConfidenceSpeeding.filter(
    (e) => e.severity === EventSeverity.LOW,
  ).length;
  const speedingMed = highConfidenceSpeeding.filter(
    (e) => e.severity === EventSeverity.MEDIUM,
  ).length;
  const speedingHigh = highConfidenceSpeeding.filter(
    (e) => e.severity === EventSeverity.HIGH,
  ).length;

  if (speedingLow > 0) {
    penalties.push({
      reason: 'Speeding (5–10 km/h over limit)',
      points: speedingLow * 1,
      eventType: DrivingEventType.SPEEDING,
      count: speedingLow,
    });
  }
  if (speedingMed > 0) {
    penalties.push({
      reason: 'Speeding (10–20 km/h over limit)',
      points: speedingMed * 3,
      eventType: DrivingEventType.SPEEDING,
      count: speedingMed,
    });
  }
  if (speedingHigh > 0) {
    penalties.push({
      reason: 'Speeding (20+ km/h over limit)',
      points: speedingHigh * 7,
      eventType: DrivingEventType.SPEEDING,
      count: speedingHigh,
    });
  }

  // ── Harsh braking ───────────────────────────────────────────────────────
  const brakingCount = eventCounts[DrivingEventType.HARSH_BRAKING] ?? 0;
  if (brakingCount > 0) {
    penalties.push({
      reason: 'Estimated harsh braking',
      points: brakingCount * 2,
      eventType: DrivingEventType.HARSH_BRAKING,
      count: brakingCount,
    });
  }

  // ── Harsh acceleration ──────────────────────────────────────────────────
  const accelCount = eventCounts[DrivingEventType.HARSH_ACCELERATION] ?? 0;
  if (accelCount > 0) {
    penalties.push({
      reason: 'Estimated harsh acceleration',
      points: accelCount * 2,
      eventType: DrivingEventType.HARSH_ACCELERATION,
      count: accelCount,
    });
  }

  // ── Sharp cornering ─────────────────────────────────────────────────────
  const cornerCount = eventCounts[DrivingEventType.SHARP_CORNERING] ?? 0;
  if (cornerCount > 0) {
    penalties.push({
      reason: 'Estimated sharp cornering',
      points: cornerCount * 2,
      eventType: DrivingEventType.SHARP_CORNERING,
      count: cornerCount,
    });
  }

  // ── Phone movement ──────────────────────────────────────────────────────
  const phoneCount = eventCounts[DrivingEventType.PHONE_MOVEMENT] ?? 0;
  if (phoneCount > 0) {
    penalties.push({
      reason: 'Possible phone movement during driving',
      points: phoneCount * 4,
      eventType: DrivingEventType.PHONE_MOVEMENT,
      count: phoneCount,
    });
    warnings.push(
      'Phone movement detected. This is an estimate based on sensor data and may not indicate actual phone usage.',
    );
  }

  // ── Night driving context modifier ─────────────────────────────────────
  const nightEvents = input.events.filter(
    (e) => e.type === DrivingEventType.NIGHT_DRIVING,
  ).length;
  if (nightEvents > 0 || isNightTime(input.startedAt)) {
    const nightPenalty = Math.min(5, nightEvents * 1);
    if (nightPenalty > 0) {
      penalties.push({
        reason: 'Night driving context modifier',
        points: nightPenalty,
        eventType: DrivingEventType.NIGHT_DRIVING,
        count: nightEvents,
      });
    }
    warnings.push('Night driving detected. Context modifier applied for coaching purposes only.');
  }

  // ── GPS signal loss (warning only) ─────────────────────────────────────
  const gpsLossCount = eventCounts[DrivingEventType.GPS_SIGNAL_LOSS] ?? 0;
  if (gpsLossCount > 0) {
    warnings.push(
      `GPS signal loss detected ${gpsLossCount} time(s). Data during signal-loss periods may be incomplete.`,
    );
  }

  // ── Crash-like spike (experimental only) ───────────────────────────────
  const crashCount = eventCounts[DrivingEventType.CRASH_LIKE_SPIKE] ?? 0;
  if (crashCount > 0) {
    warnings.push(
      `[EXPERIMENTAL] Crash-like acceleration spike detected ${crashCount} time(s). This is a prototype detection only and is NOT a confirmed crash report.`,
    );
  }

  // ── Apply distance factor for short trips ──────────────────────────────
  const rawPenalty = penalties.reduce((sum, p) => sum + p.points, 0);
  const scaledPenalty = Math.round(rawPenalty * distanceFactor);

  // ── Bonuses ─────────────────────────────────────────────────────────────
  const totalRiskyEvents = Object.values(eventCounts).reduce((a, b) => a + (b ?? 0), 0);

  if (totalRiskyEvents === 0 && input.distanceKm >= 1) {
    bonuses.push({ reason: 'Clean trip bonus', points: 3 });
  }

  if (totalRiskyEvents === 0 && input.distanceKm >= 10) {
    bonuses.push({ reason: 'Long clean trip bonus', points: 2 });
  }

  const bonusTotal = bonuses.reduce((sum, b) => sum + b.points, 0);

  // ── Final score ─────────────────────────────────────────────────────────
  const rawFinal = BASE_SCORE - scaledPenalty + bonusTotal;
  const finalScore = Math.min(MAX_SCORE, Math.max(MIN_SCORE, Math.round(rawFinal)));

  // ── Weather context warnings ────────────────────────────────────────────
  if (input.hasWeather) {
    if ((input.hasWeather.rain ?? 0) > 1) {
      warnings.push('Vožnja v dežju — zmanjšana oprijemljivost ceste.');
    }
    if ((input.hasWeather.snow ?? 0) > 0) {
      warnings.push('Vožnja po snegu — zmanjšana vidljivost in oprijemljivost.');
    }
    if ((input.hasWeather.visibility ?? 10000) < 1000) {
      warnings.push('Zmanjšana vidljivost med vožnjo.');
    }
  }

  const explanationText = buildExplanation(finalScore, penalties, bonuses, warnings);
  const driverLevel = computeDriverLevel(finalScore);
  const { recommendations, topWeaknesses, topStrengths } = buildRecommendations(penalties, eventSummary, finalScore);

  return {
    finalScore,
    baseScore: BASE_SCORE,
    penalties,
    bonuses,
    warnings,
    eventSummary,
    confidenceSummary,
    explanationText,
    driverLevel,
    recommendations,
    topWeaknesses,
    topStrengths,
  };
}

function countEventsByType(
  events: ScoringInput['events'],
): Partial<Record<DrivingEventType, number>> {
  const counts: Partial<Record<DrivingEventType, number>> = {};
  for (const e of events) {
    counts[e.type] = (counts[e.type] ?? 0) + 1;
  }
  return counts;
}

function buildEventSummary(events: ScoringInput['events']): EventSummary {
  const byType = countEventsByType(events);
  const highSeverityCount = events.filter(
    (e) => e.severity === EventSeverity.HIGH,
  ).length;
  return {
    totalEvents: events.length,
    byType,
    highSeverityCount,
  };
}

function buildConfidenceSummary(events: ScoringInput['events']): ConfidenceSummary {
  const speedingEvents = events.filter(
    (e) => e.type === DrivingEventType.SPEEDING,
  );
  return {
    speedingEventsWithHighConfidence: speedingEvents.filter(
      (e) =>
        e.speedLimitConfidence === SpeedLimitConfidence.HIGH ||
        e.speedLimitConfidence === SpeedLimitConfidence.MEDIUM,
    ).length,
    speedingEventsWithLowConfidence: speedingEvents.filter(
      (e) =>
        !e.speedLimitConfidence ||
        e.speedLimitConfidence === SpeedLimitConfidence.LOW ||
        e.speedLimitConfidence === SpeedLimitConfidence.UNKNOWN,
    ).length,
    speedLimitUnavailableCount: speedingEvents.filter(
      (e) => !e.speedLimitConfidence,
    ).length,
  };
}

function buildExplanation(
  score: number,
  penalties: ScorePenalty[],
  bonuses: ScoreBonus[],
  warnings: string[],
): string {
  const lines: string[] = [`Ocena vožnje: ${score}/100.`];

  if (penalties.length > 0) {
    lines.push('Odbitki:');
    for (const p of penalties) {
      lines.push(`  - ${p.reason}: -${p.points} točk (${p.count}× zaznano)`);
    }
  }

  if (bonuses.length > 0) {
    lines.push('Bonusi:');
    for (const b of bonuses) {
      lines.push(`  + ${b.reason}: +${b.points} točk`);
    }
  }

  if (warnings.length > 0) {
    lines.push('Opozorila:');
    for (const w of warnings) {
      lines.push(`  ⚠ ${w}`);
    }
  }

  lines.push('');
  lines.push(
    'OPOMBA: Ocena je ocenjevalna, ne zavarovalniška. Vrednosti so namenjene spodbujanju varne vožnje.',
  );

  return lines.join('\n');
}
