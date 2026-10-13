// Meta Pixel + helpers. The server-side Conversions API copy of each event is
// sent by zenaclub-backend with the same eventID, so Meta dedupes the pair.
// Set PIXEL_ID to enable; while empty every call is a no-op.
(function () {
  var PIXEL_ID = "";
  var on = !!PIXEL_ID;

  if (on && !window.fbq) {
    var n = window.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments) };
    window._fbq = n; n.push = n; n.loaded = true; n.version = "2.0"; n.queue = [];
    var s = document.createElement("script");
    s.async = true; s.src = "https://connect.facebook.net/en_US/fbevents.js";
    document.head.appendChild(s);
    fbq("init", PIXEL_ID);
    fbq("track", "PageView");
  }

  function cookie(k) {
    var m = document.cookie.match(new RegExp("(?:^|; )" + k + "=([^;]*)"));
    return m ? decodeURIComponent(m[1]) : "";
  }

  window.zmeta = {
    // _fbc/_fbp are the strongest match keys; rebuild _fbc from fbclid if the cookie isn't written yet.
    match: function () {
      var fbc = cookie("_fbc"), id = new URLSearchParams(location.search).get("fbclid");
      if (!fbc && id) fbc = "fb.1." + Date.now() + "." + id;
      return { fbc: fbc, fbp: cookie("_fbp"), sourceUrl: location.href.split("#")[0] };
    },
    uuid: function () {
      return window.crypto && crypto.randomUUID ? crypto.randomUUID() : Date.now() + "-" + Math.random().toString(16).slice(2);
    },
    track: function (name, valuePaise, eventID) {
      if (!on) return;
      try { fbq("track", name, { value: valuePaise / 100, currency: "INR" }, { eventID: eventID }) } catch (e) {}
    }
  };
})();
