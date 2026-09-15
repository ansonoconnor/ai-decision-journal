/**
 * ============================================================================
 * AI Decision Journal
 * Decision Lifecycle Projection
 *
 * File: DecisionLifecycleProjection.js
 *
 * Purpose:
 * Projects canonical Decision lifecycle events into the read models used by
 * Decision History and Decision Timeline.
 *
 * Responsibilities:
 * - Project lifecycle events into Decision History entries
 * - Project lifecycle events into Decision Timeline entries
 * - Preserve event identity and provenance across projections
 * - Remain independent of persistence and presentation
 *
 * Notes:
 * A lifecycle event is the organizational fact.
 *
 * History and Timeline are different representations of that fact.
 *
 * This module does not:
 * - detect Decision differences
 * - create lifecycle events
 * - validate lifecycle transitions
 * - persist projections
 * ============================================================================
 */

export function projectLifecycleEventToHistory(event) {
  if (!event) {
    return null;
  }

  const {
    field = "",
    previousValue = "",
    currentValue = "",
  } = event.metadata ?? {};

  return {
    id: `${event.id}-history`,
    field,
    previousValue,
    currentValue,
    updatedBy: event.actor,
    updatedByUserId: event.actorUserId,
    updatedAt: event.occurredAt,
  };
}

export function projectLifecycleEventToTimeline(event) {
  if (!event) {
    return null;
  }

  return {
    id: `${event.id}-timeline`,
    label: event.type,
    date: event.occurredAt,
    description: event.description,
  };
}