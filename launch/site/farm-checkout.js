/* Beju Farm (launch kit): offer a free sample earned in the game when the cart drawer opens.
   The site's checkout call adds window.BejuFarm.checkoutExtra() to its request; the server checks the sample and the order
   minimum again, so nothing here can be used to claim more than was earned. Needs GAME_SAMPLES=on in Netlify. */
window.BejuFarm = (function () {
  var acct = null, offer = null, min = 3000;
  var ja = (document.documentElement.lang || "").indexOf("ja") === 0;
  try { acct = JSON.parse(localStorage.getItem("beju-farm-account") || "null"); } catch (e) { /* storage blocked */ }
  function auth() { return acct ? acct.player + "." + acct.token : ""; }
  function render() {
    var msg = document.getElementById("payMsg");
    if (!offer || !msg || document.getElementById("farmSample")) return;
    var row = document.createElement("label");
    row.id = "farmSample";
    row.style.cssText = "display:flex;gap:.5rem;align-items:flex-start;margin:.5rem 0;font-size:var(--t-sm)";
    row.innerHTML = '<input type="checkbox" id="farmSampleCb" checked> <span>' + (ja
      ? "Beju Farmで獲得した無料サンプル(" + offer.coffee + " 100g)を同梱する。¥" + min.toLocaleString() + "以上のご注文が対象です。"
      : "Add my free 100 g " + offer.coffee + " sample from Beju Farm. For orders of ¥" + min.toLocaleString() + " or more.") + "</span>";
    var payBtn = msg.previousElementSibling && msg.previousElementSibling.tagName === "BUTTON" ? msg.previousElementSibling : msg;   /* above the pay button */
    payBtn.parentNode.insertBefore(row, payBtn);
  }
  if (acct && acct.player && acct.token) {
    fetch("/.netlify/functions/game-samples", { headers: { Authorization: "Bearer " + auth() } })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        if (!d) return;
        min = (d.rules && d.rules.minOrder) || min;
        offer = (d.samples || []).filter(function (s) { return s.status === "earned"; })[0] || null;
        render();
        new MutationObserver(render).observe(document.body, { childList: true, subtree: true });   /* the cart drawer is drawn on demand */
      })
      .catch(function () { /* no farm, no offer */ });
  }
  return {
    checkoutExtra: function () {
      var cb = document.getElementById("farmSampleCb");
      return offer && cb && cb.checked ? { auth: auth(), sample: offer.id } : undefined;
    }
  };
})();
