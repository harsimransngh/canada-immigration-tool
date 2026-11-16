// Privacy-scoped activity tracker for the Canada Immigration Tool.
// Sends event beacons to /api/log. By design it NEVER sends the answers a
// visitor types into the simulator: only the event name, a random per-tab
// session id, the language test selected, and a coarse CRS score band.
// Everything is wrapped so a logging failure can never affect the tool.
(function () {
  try {
    var KEY = "cit_session";
    var sid = null;
    try {
      sid = sessionStorage.getItem(KEY);
      if (!sid) { sid = Math.random().toString(36).slice(2) + Date.now().toString(36); sessionStorage.setItem(KEY, sid); }
    } catch (e) { sid = "nosession"; }

    function band(score) {
      if (score < 300) return "under 300";
      if (score < 400) return "300-399";
      if (score < 450) return "400-449";
      if (score < 500) return "450-499";
      if (score < 520) return "500-519";
      if (score < 550) return "520-549";
      return "550+";
    }

    function send(event, data) {
      try {
        var payload = { session: sid, event: event };
        if (data) { for (var k in data) payload[k] = data[k]; }
        var body = JSON.stringify(payload);
        if (navigator.sendBeacon) { navigator.sendBeacon("/api/log", new Blob([body], { type: "application/json" })); return; }
        fetch("/api/log", { method: "POST", headers: { "Content-Type": "application/json" }, body: body, keepalive: true }).catch(function () {});
      } catch (e) { /* logging must never break the tool */ }
    }

    window.trackEvent = send;
    window.trackScore = function (score, test) {
      try { send("score_computed", { band: band(score), test: test || null }); } catch (e) {}
    };

    send("page_view", {});
  } catch (e) { /* no-op */ }
})();
