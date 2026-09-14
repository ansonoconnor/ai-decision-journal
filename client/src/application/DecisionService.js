import SupabaseDecisionRepository from "../repositories/SupabaseDecisionRepository";
import DecisionFactory from "../../../src/factories/DecisionFactory.js";

import {
  canTransition,
} from "../../../src/domain/decisionLifecycle.js";

import {
  detectDecisionDifferences,
} from "../../../src/domain/DecisionDifference.js";

import {
  DecisionLifecycleEventType,
  createDecisionLifecycleEvent,
} from "../../../src/domain/DecisionLifecycleEvent.js";

import {
  projectLifecycleEventToHistory,
  projectLifecycleEventToTimeline,
} from "../../../src/domain/DecisionLifecycleProjection.js";

/**
 * DecisionService
 *
 * Owns business operations for the Decision domain.
 *
 * The UI interacts with this service instead of communicating
 * directly with repositories or persistence implementations.
 */
class DecisionService {
  constructor(repository = new SupabaseDecisionRepository()) {
    this.repository = repository;
  }

  async getDecisions() {
    return this.repository.getAll();
  }

  async getDecision(id) {
    return this.repository.getById(id);
  }

  /**
   * Creates a new Decision using the canonical DecisionFactory.
   */
  async createDecision() {
    const organizationId =
      await this.repository.getCurrentOrganizationId();

    const decision = DecisionFactory.create({
      organizationId,
    });

    return this.repository.create(decision);
  }

  /**
   * Updates an existing Decision.
   *
   * Meaningful identity changes are detected against the persisted
   * Decision state and converted into lifecycle evidence.
   */
  async updateDecision(
    id,
    proposedDecision,
    actor = "Current User"
  ) {
    const persistedDecision =
      await this.repository.getById(id);

    if (!persistedDecision) {
      throw new Error(`Decision '${id}' not found.`);
    }

    this.validateLifecycleTransition(
      persistedDecision,
      proposedDecision
    );

    const differences = detectDecisionDifferences(
      persistedDecision,
      proposedDecision
    );

    const lifecycleEvents = differences.map((difference) =>
      this.createLifecycleEventFromDifference(
        difference,
        actor
      )
    );

    const historyEntries = lifecycleEvents
      .map(projectLifecycleEventToHistory)
      .filter(Boolean);

    const timelineEntries = lifecycleEvents
      .map(projectLifecycleEventToTimeline)
      .filter(Boolean);

    const updatedDecision = {
      ...proposedDecision,

      history: [
        ...(persistedDecision.history || []),
        ...historyEntries,
      ],

      timeline: [
        ...(persistedDecision.timeline || []),
        ...timelineEntries,
      ],
    };

    return this.repository.update(
      id,
      updatedDecision
    );
  }

  async deleteDecision(id) {
    return this.repository.delete(id);
  }

  async approveDecision(id) {
    const decision = await this.repository.getById(id);

    if (!decision) {
      throw new Error(`Decision '${id}' not found.`);
    }

    const updatedDecision = {
      ...decision,
      identity: {
        ...decision.identity,
        status: "Approved",
      },
    };

    return this.updateDecision(
      id,
      updatedDecision
    );
  }

  validateLifecycleTransition(
    persistedDecision,
    proposedDecision
  ) {
    const previousStatus =
      persistedDecision.identity?.status;

    const proposedStatus =
      proposedDecision.identity?.status;

    if (previousStatus === proposedStatus) {
      return;
    }

    if (
      !canTransition(
        previousStatus,
        proposedStatus
      )
    ) {
      throw new Error(
        `Invalid Decision lifecycle transition: ` +
          `'${previousStatus}' → '${proposedStatus}'.`
      );
    }
  }

  createLifecycleEventFromDifference(
    difference,
    actor
  ) {
    const eventTypeByField = {
      title: DecisionLifecycleEventType.TITLE_CHANGED,
      owner: DecisionLifecycleEventType.OWNER_CHANGED,
      status: DecisionLifecycleEventType.STATUS_CHANGED,
      priority: DecisionLifecycleEventType.PRIORITY_CHANGED,
      type: DecisionLifecycleEventType.TYPE_CHANGED,
    };

    const eventType =
      eventTypeByField[difference.field];

    if (!eventType) {
      throw new Error(
        `Unsupported Decision difference field: ` +
          `'${difference.field}'.`
      );
    }

    return createDecisionLifecycleEvent({
      type: eventType,

      description:
        `${difference.label} changed from ` +
        `'${difference.previousValue}' to ` +
        `'${difference.currentValue}'.`,

      actor,

      metadata: {
        field: difference.field,
        previousValue: difference.previousValue,
        currentValue: difference.currentValue,
      },
    });
  }
}

const decisionService = new DecisionService();

export default decisionService;