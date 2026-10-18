/* Beju Farm (launch kit): on the thank-you page, offer to add this order to the customer's farm.
   The game claims the paid order on the server: 1 crane per ¥100, passport stamps and any process the coffee unlocks. */
(function () {
  var id = new URLSearchParams(location.search).get("session_id");
  if (!id || !/^cs_(test|live)_[A-Za-z0-9]{10,}$/.test(id)) return;
  var ja = (document.documentElement.lang || "").indexOf("ja") === 0;
  function add() {
    var box = document.getElementById("orderBox");
    if (!box || document.getElementById("farmCta")) return;
    var card = document.createElement("div");
    card.className = "orderbox"; card.id = "farmCta";
    card.innerHTML = ja
      ? '<h3>Beju Farmにこのご注文を追加</h3><p>¥100ごとに1羽の鶴、新しい産地のスタンプ、コーヒーによっては新しい精製方法がファームに届きます。</p><p><a class="btn primary" href="/farm/?claim=' + encodeURIComponent(id) + '">ファームに追加する</a></p>'
      : '<h3>Add this order to Beju Farm</h3><p>Your coffee feeds your farm: 1 crane for every ¥100, a passport stamp for each new origin, and some coffees unlock a new process.</p><p><a class="btn primary" href="/farm/?claim=' + encodeURIComponent(id) + '">Add to my farm</a></p>';
    box.parentNode.insertBefore(card, box.nextSibling);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", add); else add();
})();
