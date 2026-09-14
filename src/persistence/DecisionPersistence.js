import DecisionPersistenceMapper from "./DecisionPersistenceMapper.js";

class DecisionPersistence {
  constructor(client) {
    if (!client) {
      throw new Error(
        "DecisionPersistence requires a Supabase client."
      );
    }

    this.db = client;
  }

  async getCurrentOrganizationId() {
    const { data, error } = await this.db
      .from("organization_memberships")
      .select("organization_id")
      .limit(2);

    if (error) throw error;

    if (!data?.length) {
      throw new Error(
        "The authenticated user does not belong to an organization."
      );
    }

    if (data.length > 1) {
      throw new Error(
        "Decision creation requires an explicit organization when multiple memberships exist."
      );
    }

    return data[0].organization_id;
  }

  async getAll() {
    const { data, error } = await this.db
      .from("decisions")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return (data || []).map((decision) =>
      DecisionPersistenceMapper.fromPersistence({
        decision,
      })
    );
  }

  async getById(id) {
    const { data: decision, error: decisionError } = await this.db
      .from("decisions")
      .select("*")
      .eq("id", id)
      .single();

    if (decisionError) throw decisionError;

    const [
      { data: evidence = [], error: evidenceError },
      { data: timeline = [], error: timelineError },
      { data: history = [], error: historyError },
      { data: approvals = [], error: approvalsError },
      { data: tags = [], error: tagsError },
    ] = await Promise.all([
      this.db
        .from("decision_evidence")
        .select("*")
        .eq("decision_id", id)
        .order("sort_order"),

      this.db
        .from("decision_timeline")
        .select("*")
        .eq("decision_id", id)
        .order("sort_order"),

      this.db
        .from("decision_history")
        .select("*")
        .eq("decision_id", id)
        .order("updated_at", { ascending: true }),

      this.db
        .from("decision_approvals")
        .select("*")
        .eq("decision_id", id),

      this.db
        .from("decision_tags")
        .select("*")
        .eq("decision_id", id)
        .order("sort_order"),
    ]);

    if (evidenceError) throw evidenceError;
    if (timelineError) throw evidenceError;
    if (historyError) throw historyError;
    if (approvalsError) throw approvalsError;
    if (tagsError) throw tagsError;

    return DecisionPersistenceMapper.fromPersistence({
      decision,
      evidence,
      timeline,
      history,
      approvals,
      tags,
    });
  }

  async create(decision) {
    await this.saveDecision(decision);

    return this.getById(decision.identity.id);
  }

  async update(id, decision) {
    await this.saveDecision(decision);

    return this.getById(id);
  }

  async delete(id) {
    const tables = [
      "decision_tags",
      "decision_approvals",
      "decision_history",
      "decision_timeline",
      "decision_evidence",
    ];

    for (const table of tables) {
      const { error } = await this.db
        .from(table)
        .delete()
        .eq("decision_id", id);

      if (error) throw error;
    }

    const { error } = await this.db
      .from("decisions")
      .delete()
      .eq("id", id);

    if (error) throw error;
  }

  async clearDatabase() {
    const tables = [
      "decision_tags",
      "decision_approvals",
      "decision_history",
      "decision_timeline",
      "decision_evidence",
      "decisions",
    ];

    for (const table of tables) {
      const { error } = await this.db
        .from(table)
        .delete()
        .neq("id", "");

      if (error) throw error;
    }
  }

  async saveDecision(decision) {
    const decisionRow =
      DecisionPersistenceMapper.toDecisionRow(decision);

    const { error } = await this.db
      .from("decisions")
      .upsert(decisionRow);

    if (error) throw error;

    await this.insertEvidence(decision);
    await this.insertTimeline(decision);
    await this.insertHistory(decision);
    await this.insertApprovals(decision);
    await this.insertTags(decision);
  }

  async insertEvidence(decision) {
    const rows =
      DecisionPersistenceMapper.toEvidenceRows(decision);

    if (!rows.length) return;

    const { error } = await this.db
      .from("decision_evidence")
      .upsert(rows);

    if (error) throw error;
  }

  async insertTimeline(decision) {
    const rows =
      DecisionPersistenceMapper.toTimelineRows(decision);

    if (!rows.length) return;

    const { error } = await this.db
      .from("decision_timeline")
      .upsert(rows);

    if (error) throw error;
  }

  async insertHistory(decision) {
    const rows =
      DecisionPersistenceMapper.toHistoryRows(decision);

    if (!rows.length) return;

    const { error } = await this.db
      .from("decision_history")
      .upsert(rows);

    if (error) throw error;
  }

  async insertApprovals(decision) {
    const rows =
      DecisionPersistenceMapper.toApprovalRows(decision);

    if (!rows.length) return;

    const { error } = await this.db
      .from("decision_approvals")
      .upsert(rows);

    if (error) throw error;
  }

  async insertTags(decision) {
    const rows =
      DecisionPersistenceMapper.toTagRows(decision);

    if (!rows.length) return;

    const { error } = await this.db
      .from("decision_tags")
      .upsert(rows);

    if (error) throw error;
  }
}

export default DecisionPersistence;