/**
 * ============================================================================
 * AI Decision Journal
 * Decision Lifecycle Event
 *
 * File: DecisionLifecycleEvent.js
 *
 * Purpose:
 * Represents organizational events that occur during the lifecycle of a
 * Decision.
 *
 * Responsibilities:
 * - Represent a single lifecycle event
 * - Capture who performed the action
 * - Capture when the action occurred
 * - Describe what happened
 * - Carry structured metadata for downstream projections
 * - Translate supported Decision differences into lifecycle events
 *
 * Notes:
 * A lifecycle event represents organizational evidence.
 *
 * It does not:
 * - detect Decision differences
 * - validate lifecycle transitions
 * - persist itself
 * - generate history projections
 * - generate timeline projections
 * ============================================================================
 */

export const DecisionLifecycleEventType = Object.freeze({
  DECISION_CREATED: "Decision Created",
  TITLE_CHANGED: "Title Changed",
  OWNER_CHANGED: "Owner Changed",
  STATUS_CHANGED: "Status Changed",
  PRIORITY_CHANGED: "Priority Changed",
  TYPE_CHANGED: "Type Changed",
});

const eventTypeByField = {
  title: DecisionLifecycleEventType.TITLE_CHANGED,
  owner: DecisionLifecycleEventType.OWNER_CHANGED,
  status: DecisionLifecycleEventType.STATUS_CHANGED,
  priority: DecisionLifecycleEventType.PRIORITY_CHANGED,
  type: DecisionLifecycleEventType.TYPE_CHANGED,
};

export function createDecisionLifecycleEvent({
  type,
  description,
  actor = "System",
  actorUserId = null,
  occurredAt = new Date().toISOString(),
  metadata = {},
}) {
  return {
    id: crypto.randomUUID(),
    type,
    description,
    actor,
    actorUserId,
    occurredAt,
    metadata,
  };
}

export function createLifecycleEventFromDifference(
  difference,
  {
    actor = "System",
    actorUserId = null,
    occurredAt = new Date().toISOString(),
  } = {}
) {
  if (!difference) {
    return null;
  }

  const type = eventTypeByField[difference.field];

  if (!type) {
    return null;
  }

  const previousValue =
    difference.previousValue || "Not assigned";

  const currentValue =
    difference.currentValue || "Not assigned";

  return createDecisionLifecycleEvent({
    type,
    description:
      `${difference.label} changed from ` +
      `"${previousValue}" to "${currentValue}".`,
    actor,
    actorUserId,
    occurredAt,
    metadata: {
      field: difference.field,
      previousValue: difference.previousValue,
      currentValue: difference.currentValue,
    },
  });
}