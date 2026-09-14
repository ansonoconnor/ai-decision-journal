/**
 * ============================================================================
 * AI Decision Journal
 * Supabase Decision Repository
 *
 * Purpose:
 * Implements the DecisionRepository contract by delegating persistence
 * operations to the DecisionPersistence layer.
 *
 * Responsibilities:
 * - Expose repository operations to the application layer
 * - Delegate persistence concerns
 * - Hide persistence implementation details
 * ============================================================================
 */

import DecisionRepository from "./DecisionRepository";
import DecisionPersistence from "../../../src/persistence/DecisionPersistence.js";
import browserSupabase from "../infrastructure/supabase/client";

export default class SupabaseDecisionRepository extends DecisionRepository {
  constructor() {
    super();
    this.persistence = new DecisionPersistence(browserSupabase);
  }

  /**
   * Returns the organization associated with the
   * current authenticated membership context.
   */
  async getCurrentOrganizationId() {
    return this.persistence.getCurrentOrganizationId();
  }

  /**
   * Returns all decision summaries.
   */
  async getAll() {
    return this.persistence.getAll();
  }

  /**
   * Returns a complete decision aggregate.
   */
  async getById(id) {
    return this.persistence.getById(id);
  }

  /**
   * Creates a decision.
   */
  async create(decision) {
    return this.persistence.create(decision);
  }

  /**
   * Updates a decision.
   */
  async update(id, decision) {
    return this.persistence.update(id, decision);
  }

  /**
   * Deletes a decision.
   */
  async delete(id) {
    return this.persistence.delete(id);
  }
}