/**
 * ============================================================================
 * AI Decision Journal
 * Decision Factory
 *
 * Purpose:
 * Creates canonical Decision aggregates.
 *
 * Responsibilities:
 * - Construct valid Decision domain objects
 * - Apply default values
 * - Centralize Decision creation logic
 * - Keep creation concerns out of the UI
 * ============================================================================
 */

import {
  DecisionPriority,
  DecisionStatus,
  DecisionType,
} from "../domain/decisionLifecycle.js";

export default class DecisionFactory {
  static create({ organizationId } = {}) {
    if (!organizationId) {
      throw new Error(
        "DecisionFactory requires an organizationId."
      );
    }

    const id = crypto.randomUUID();

    return {
      organizationId,

      identity: {
        id,
        title: "Untitled Decision",
        status: DecisionStatus.DRAFT,
        priority: DecisionPriority.MEDIUM,
        type: DecisionType.GOVERNANCE,
        owner: "",
      },

      summary: "",

      question: "",

      context: "",

      governance: {
        aiRecommendation: "",
        finalDecision: "",
        rationale: "",
        reviewer: "",
        reviewedAt: null,
      },

      outcome: {
        implementationStatus: "Draft",
        expectedOutcome: "",
        actualOutcome: "",
        outcomeDate: null,
      },

      lessons: {
        keyLesson: "",
        whatWorked: "",
        whatDidNotWork: "",
        recommendedAdjustment: "",
      },

      evidence: [],

      timeline: [],

      history: [],

      approvals: [],

      tags: [],

      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };
  }
}