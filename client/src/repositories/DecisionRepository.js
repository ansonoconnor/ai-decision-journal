/**
 * DecisionRepository
 *
 * Defines the persistence contract for Decision data.
 *
 * Implementations may retrieve decisions from:
 * - Mock data
 * - Supabase
 * - REST APIs
 * - Other persistence providers
 *
 * The rest of the application should depend only on this contract,
 * never on a specific persistence implementation.
 */
export default class DecisionRepository {
  async getCurrentActor() {
    throw new Error(
      "getCurrentActor() must be implemented."
    );
  }

  async getCurrentOrganizationId() {
    throw new Error(
      "getCurrentOrganizationId() must be implemented."
    );
  }

  async getAll() {
    throw new Error("getAll() must be implemented.");
  }

  async getById(id) {
    throw new Error("getById() must be implemented.");
  }

  async create(decision) {
    throw new Error("create() must be implemented.");
  }

  async update(id, decision) {
    throw new Error("update() must be implemented.");
  }

  async delete(id) {
    throw new Error("delete() must be implemented.");
  }
}
