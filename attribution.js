// Campaign attribution for the Play Store "Download the app" link.
//
// Goal: the Android app reads the Play Install Referrer on first launch and can tell
//   (1) which ad campaign sent the user to the website, and
//   (2) that the install came from the website at all (even with no campaign).
//
// Campaign params (utm_*, fbclid, gclid, ...) are captured on ANY page that loads this
// file, kept in localStorage for 30 days, then appended to the Play URL as `referrer=`.
// Rule: the latest visit that carries campaign params wins (last touch); a later visit
// with none never wipes it.
(function () {
  var KEY = "zattr", TTL = 30 * 864e5, MAX_ENCODED = 900; // keep the whole referrer well under Play's limit
  var CLICK_IDS = ["fbclid", "gclid", "gbraid", "wbraid", "ttclid", "msclkid"];
  var PRIORITY = ["utm_source", "utm_medium", "utm_campaign", "utm_id"].concat(CLICK_IDS, ["utm_content", "utm_term"]);
  var mem = null; // used when localStorage is blocked (private mode, in-app browsers)

  function read() {
    try {
      var s = JSON.parse(localStorage.getItem(KEY) || "null");
      if (s && s.t && Date.now() - s.t < TTL && s.p) return s;
    } catch (e) {}
    return mem && Date.now() - mem.t < TTL ? mem : null;
  }
  function write(s) {
    mem = s;
    try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {}
  }

  // Params on the current URL: any utm_*, plus the ad networks' click ids.
  function fromUrl(search) {
    var out = {}, got = false;
    try {
      new URLSearchParams(search).forEach(function (v, k) {
        k = k.toLowerCase();
        if (v && (/^utm_[a-z0-9_]{1,30}$/.test(k) || CLICK_IDS.indexOf(k) >= 0)) { out[k] = String(v).slice(0, 120); got = true; }
      });
    } catch (e) {}
    return got ? out : null;
  }

  var found = fromUrl(location.search);
  if (found) write({ p: found, t: Date.now(), lp: location.pathname });

  function rank(k) { var i = PRIORITY.indexOf(k); return i < 0 ? PRIORITY.length : i; }

  // The referrer value is itself a query string: `k=v&k2=v2`. It is URL-encoded exactly once,
  // when it is put into the Play URL (encoding the pieces AND the whole would double-encode).
  function referrer() {
    var s = read(), pairs;
    if (s) {
      pairs = Object.keys(s.p).sort(function (a, b) { return rank(a) - rank(b); }).map(function (k) { return [k, s.p[k]]; });
      pairs.unshift(["zena_origin", "web"]);
    } else {
      // No campaign: still say the install came from the website.
      pairs = [["zena_origin", "web"], ["utm_source", "zenaastro_web"], ["utm_medium", "website"]];
    }
    function join() { return pairs.map(function (p) { return encodeURIComponent(p[0]) + "=" + encodeURIComponent(p[1]); }).join("&"); }
    // Too long once encoded: drop the least important params from the end, never the origin marker.
    while (pairs.length > 1 && encodeURIComponent(join()).length > MAX_ENCODED) pairs.pop();
    return join();
  }

  function playUrl(base) {
    return base + (base.indexOf("?") < 0 ? "?" : "&") + "referrer=" + encodeURIComponent(referrer());
  }

  window.zattr = { playUrl: playUrl, referrer: referrer, get: read, _fromUrl: fromUrl };
})();
