import DecisionRepository from "./DecisionRepository";
import decisions from "../data/decisions";

/**
 * MockDecisionRepository
 *
 * Temporary in-memory implementation of the DecisionRepository contract.
 *
 * This allows the application layer to be built independently of
 * the persistence layer. A future SupabaseDecisionRepository will
 * implement the same interface.
 */
export default class MockDecisionRepository extends DecisionRepository {
  constructor(
    organizationId = "mock-organization",
    actor = {
      userId: "mock-authenticated-user",
      label: "Mock Authenticated User",
    }
  ) {
    super();

    this.organizationId = organizationId;
    this.actor = actor;

    // Clone the data so mutations don't affect the imported module.
    this.decisions = structuredClone(decisions);
  }

  async getCurrentActor() {
    return {
      ...this.actor,
    };
  }

  async getCurrentOrganizationId() {
    return this.organizationId;
  }

  async getAll() {
    return this.decisions;
  }

  async getById(id) {
    return this.decisions.find(
      (decision) => decision.identity.id === id
    );
  }

  async create(decision) {
    this.decisions.push(decision);
    return decision;
  }

  async update(id, updatedDecision) {
    const index = this.decisions.findIndex(
      (decision) => decision.identity.id === id
    );

    if (index === -1) {
      throw new Error(`Decision '${id}' not found.`);
    }

    this.decisions[index] = updatedDecision;

    return updatedDecision;
  }

  async delete(id) {
    const index = this.decisions.findIndex(
      (decision) => decision.identity.id === id
    );

    if (index === -1) {
      throw new Error(`Decision '${id}' not found.`);
    }

    const [removed] = this.decisions.splice(index, 1);

    return removed;
  }
}
