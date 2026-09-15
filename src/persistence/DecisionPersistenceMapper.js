class DecisionPersistenceMapper {
  static toDecisionRow(decision) {
    return {
      id: decision.identity.id,
      organization_id: decision.organizationId,
      title: decision.identity.title,
      status: decision.identity.status,
      priority: decision.identity.priority,
      decision_type: decision.identity.type,
      owner: decision.identity.owner,

      summary: decision.summary,

      question: decision.question,

      context: decision.context,

      ai_recommendation: decision.governance.aiRecommendation,
      final_decision: decision.governance.finalDecision,
      rationale: decision.governance.rationale,
      reviewer: decision.governance.reviewer,
      reviewed_at: decision.governance.reviewedAt,

      implementation_status: decision.outcome.implementationStatus,
      expected_outcome: decision.outcome.expectedOutcome,
      actual_outcome: decision.outcome.actualOutcome,
      outcome_date: decision.outcome.outcomeDate,

      lesson: decision.lessons.keyLesson,
      worked: decision.lessons.whatWorked,
      didnt_work: decision.lessons.whatDidNotWork,
      adjustment: decision.lessons.recommendedAdjustment,
    };
  }

  static toEvidenceRows(decision) {
    return (decision.evidence || []).map((evidence, index) => ({
      id: evidence.id,
      decision_id: decision.identity.id,
      knowledge_chunk_id: evidence.knowledgeChunkId ?? null,
      title: evidence.title,
      source: evidence.source,
      summary: evidence.summary,
      confidence: evidence.confidence,
      sort_order: index,
    }));
  }

  static toTimelineRows(decision) {
    return (decision.timeline || []).map((event, index) => ({
      id: event.id,
      decision_id: decision.identity.id,
      label: event.label,
      event_date: event.date,
      description: event.description,
      sort_order: index,
    }));
  }

  static toHistoryRows(decision) {
    return (decision.history || []).map((entry) => ({
      id: entry.id,
      decision_id: decision.identity.id,
      field: entry.field,
      previous_value: entry.previousValue,
      current_value: entry.currentValue,
      updated_by: entry.updatedBy,
      actor_user_id: entry.updatedByUserId ?? null,
      updated_at: entry.updatedAt,
    }));
  }

  static toApprovalRows(decision) {
    return (decision.approvals || []).map((approval) => ({
      id: approval.id,
      decision_id: decision.identity.id,
      approver: approval.approver,
      role: approval.role,
      status: approval.status,
      approval_date: approval.date,
      comments: approval.comments,
    }));
  }

  static toTagRows(decision) {
    return (decision.tags || []).map((tag, index) => ({
      id: `${decision.identity.id}-tag-${index + 1}`,
      decision_id: decision.identity.id,
      tag,
      sort_order: index,
    }));
  }

  static fromPersistence({
    decision,
    evidence = [],
    timeline = [],
    history = [],
    approvals = [],
    tags = [],
  }) {
    return {
      organizationId: decision.organization_id,

      identity: {
        id: decision.id,
        title: decision.title,
        status: decision.status,
        priority: decision.priority,
        type: decision.decision_type,
        owner: decision.owner,
      },

      summary: decision.summary,

      question: decision.question,

      context: decision.context,

      governance: {
        aiRecommendation: decision.ai_recommendation,
        finalDecision: decision.final_decision,
        rationale: decision.rationale,
        reviewer: decision.reviewer,
        reviewedAt: decision.reviewed_at,
      },

      outcome: {
        implementationStatus: decision.implementation_status,
        expectedOutcome: decision.expected_outcome,
        actualOutcome: decision.actual_outcome,
        outcomeDate: decision.outcome_date,
      },

      lessons: {
        keyLesson: decision.lesson,
        whatWorked: decision.worked,
        whatDidNotWork: decision.didnt_work,
        recommendedAdjustment: decision.adjustment,
      },

      evidence,

      timeline,

      history: history.map((entry) => ({
        id: entry.id,
        field: entry.field,
        previousValue: entry.previous_value,
        currentValue: entry.current_value,
        updatedBy: entry.updated_by,
        updatedByUserId: entry.actor_user_id,
        updatedAt: entry.updated_at,
      })),

      approvals,

      tags: tags.map((t) => t.tag),

      metadata: {},
    };
  }
}

export default DecisionPersistenceMapper;
