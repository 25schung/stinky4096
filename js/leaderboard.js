// js/leaderboard.js
(() => {
  "use strict";

  const SUPABASE_URL = "https://vjeydkdrqmbgynawvges.supabase.co";
  const SUPABASE_KEY = "sb_publishable_VtLTnMCWKNHYij3fosvyBg_Lw1FomUu"; // ok for client

  if (!window.supabase?.createClient) {
    console.warn("Leaderboard: Supabase library not loaded. Check script order in index.html.");
    return;
  }

  // Client
  const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  window.sb = sb; // keep for debugging

  // Always target public schema explicitly
  const lb = () => sb.schema("public").from("leaderboard");

  // DOM
  const panel = document.querySelector(".leaderboard-panel");
  const btnClose = document.querySelector(".leaderboard-close");
  const statusEl = document.querySelector(".leaderboard-status");
  const listEl = document.querySelector(".leaderboard-list");
  const crown = document.querySelector(".crown-hitbox");

  if (!panel || !statusEl || !listEl) {
    console.warn("Leaderboard: missing required DOM elements.");
    return;
  }

  async function fetchTop10() {
    return lb()
      .select("name, score, created_at")
      .order("score", { ascending: false })
      .order("created_at", { ascending: true })
      .limit(10);
  }

  async function loadTop10() {
    statusEl.textContent = "Loading...";
    listEl.innerHTML = "";

    const { data, error } = await fetchTop10();

    if (error) {
      console.error("Leaderboard fetch error:", error);
      statusEl.textContent = "Error loading leaderboard.";
      return;
    }

    if (!data || data.length === 0) {
      statusEl.textContent = "No scores yet.";
      return;
    }

    statusEl.textContent = "";
    for (const row of data) {
      const li = document.createElement("li");
      li.textContent = `${row.name} - ${row.score}`;
      listEl.appendChild(li);
    }
  }

  function openLeaderboard() {
    panel.hidden = false;
    loadTop10();
  }

  function closeLeaderboard() {
    panel.hidden = true;
  }

  async function get10thScoreCutoff() {
    const { data, error } = await lb()
      .select("score, created_at")
      .order("score", { ascending: false })
      .order("created_at", { ascending: true })
      .limit(10);

    if (error) {
      console.error("Leaderboard cutoff error:", error);
      return null;
    }
    if (!data || data.length < 10) return -Infinity;
    return data[9].score;
  }

  // Public API
  window.openLeaderboard = openLeaderboard;
  window.closeLeaderboard = closeLeaderboard;

  window.submitLeaderboardScore = async function submitLeaderboardScore(name, score) {
    const cleanName = (name || "").trim().slice(0, 24);
    if (!cleanName) return { ok: false, message: "name missing" };
    if (!Number.isFinite(score) || score <= 0) return { ok: false, message: "score invalid" };

    const { error } = await lb().insert([{ name: cleanName, score }]); // no .select()

    if (error) {
      console.error("Leaderboard submit error:", error);
      return { ok: false, message: error.message, code: error.code };
    }
    return { ok: true };
  };

  window.promptAndSubmitScore = async function promptAndSubmitScore(score) {
    if (!Number.isFinite(score) || score <= 0) return;

    const cutoff = await get10thScoreCutoff();
    if (cutoff === null) return;
    if (score <= cutoff) return;

    const name = window.prompt("Top 10! Enter your name:");
    if (!name) return;

    const res = await window.submitLeaderboardScore(name, score);
    if (!res.ok) {
      // Trigger-based block will usually surface as P0001 with your exception message,
      // but handle generic RLS/permission errors too.
      if (res.message?.includes("NAME_CONTAINS_BANNED_WORD")) {
        alert("This is a no profanity zone bitch.");
      } else {
        alert("That name can't be submitted. Pick another next time.");
      }
      return;
    }

    if (!panel.hidden) loadTop10();
  };

  // UI events
  btnClose?.addEventListener("click", (e) => {
    e.preventDefault();
    closeLeaderboard();
  });

  panel.addEventListener("click", (e) => {
    if (e.target === panel) closeLeaderboard();
  });

  if (crown) {
    crown.addEventListener("click", (e) => {
      e.preventDefault();
      openLeaderboard();
    });

    crown.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openLeaderboard();
      }
    });
  }
})();