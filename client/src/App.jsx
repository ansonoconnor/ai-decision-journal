import { useEffect, useState } from "react";
import "./App.css";

import AuthGate from "./components/AuthGate";
import DecisionWorkspace from "./components/DecisionWorkspace";
import DecisionList from "./components/DecisionList";

import decisionService from "./application/DecisionService";
import supabase from "./infrastructure/supabase/client";

function App() {
  const [session, setSession] = useState(null);
  const [isAuthLoading, setIsAuthLoading] =
    useState(true);

  const [decisions, setDecisions] = useState([]);
  const [selectedDecision, setSelectedDecision] =
    useState(null);

  async function loadDecision(decisionSummary) {
    if (!decisionSummary) {
      setSelectedDecision(null);
      return;
    }

    try {
      const decision = await decisionService.getDecision(
        decisionSummary.identity.id
      );

      setSelectedDecision(decision);
    } catch (error) {
      console.error("Failed to load decision.", error);
    }
  }

  async function refreshDecisions(selectedId = null) {
    try {
      const summaries =
        await decisionService.getDecisions();

      setDecisions(summaries);

      if (!summaries.length) {
        setSelectedDecision(null);
        return;
      }

      const summaryToLoad =
        summaries.find(
          (decision) =>
            decision.identity.id === selectedId
        ) || summaries[0];

      await loadDecision(summaryToLoad);
    } catch (error) {
      console.error(
        "Failed to refresh decisions.",
        error
      );
    }
  }

  async function handleNewDecision() {
    try {
      const decision =
        await decisionService.createDecision();

      await refreshDecisions(
        decision.identity.id
      );
    } catch (error) {
      console.error(
        "Failed to create decision.",
        error
      );
    }
  }

  async function handleDecisionSaved(
    updatedDecision
  ) {
    await refreshDecisions(
      updatedDecision.identity.id
    );
  }

  async function handleSignOut() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Failed to sign out.", error);
    }
  }

  useEffect(() => {
    let isMounted = true;

    async function initializeSession() {
      const {
        data: { session: existingSession },
        error,
      } = await supabase.auth.getSession();

      if (!isMounted) {
        return;
      }

      if (error) {
        console.error(
          "Failed to restore authentication session.",
          error
        );
      }

      setSession(existingSession);
      setIsAuthLoading(false);
    }

    initializeSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        if (!isMounted) {
          return;
        }

        setSession(nextSession);
        setIsAuthLoading(false);
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!session) {
      setDecisions([]);
      setSelectedDecision(null);
      return;
    }

    refreshDecisions();
  }, [session]);

  if (isAuthLoading) {
    return (
      <div className="auth-loading">
        Checking authentication...
      </div>
    );
  }

  if (!session) {
    return <AuthGate />;
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-session">
          <span className="header-session-identity">
            {session.user.email}
          </span>

          <button
            type="button"
            className="header-sign-out"
            onClick={handleSignOut}
          >
            Sign out
          </button>
        </div>

        <h1>AI Decision Journal</h1>

        <p className="subtitle">
          Record • Review • Learn
        </p>
      </header>

      <main className="content">
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            marginBottom: "1.5rem",
          }}
        >
          <button
            type="button"
            onClick={handleNewDecision}
          >
            + New Decision
          </button>
        </div>

        <div className="workspace">
          <DecisionList
            decisions={decisions}
            selectedDecision={selectedDecision}
            onSelectDecision={loadDecision}
          />

          <DecisionWorkspace
            decision={selectedDecision}
            onDecisionSaved={handleDecisionSaved}
          />
        </div>
      </main>
    </div>
  );
}

export default App;