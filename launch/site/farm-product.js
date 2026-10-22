/* Beju Farm (launch kit): on each coffee's page, a line under the buy button saying what the coffee does in the game.
   Keep in step with COFFEES in game-assets/play/template.html and the order bonus in netlify/lib/game.js. */
(function () {
  var FARM = {
    casablanca: ["a passport stamp for Mogiana, Huila or Turrialba, whichever you don't have yet", "モジアナ、ウイラ、トゥリアルバのうち未取得の産地スタンプ"],
    pinkwhiskey: ["the Huila stamp and whiskey-barrel processing", "ウイラのスタンプとウイスキー樽の精製方法"],
    rumbarrel: ["the Huila stamp and rum-barrel processing", "ウイラのスタンプとラム樽の精製方法"],
    yirgacheffe: ["the Gedeo stamp", "ゲデオのスタンプ"],
    strawberry: ["the Lake Toba stamp and strawberry processing", "トバ湖のスタンプとストロベリーの精製方法"]
  };
  function add() {
    var b = document.querySelector("[data-add-cp]"), pid = b && b.getAttribute("data-add-cp"), row = b && b.closest(".buyrow");
    if (!FARM[pid] || !row || document.getElementById("farmNote")) return;
    var ja = (document.documentElement.lang || "").indexOf("ja") === 0, p = document.createElement("p");
    p.className = "subnote"; p.id = "farmNote";
    p.innerHTML = ja
      ? '<a href="/farm/">Beju Farm</a>では：¥100ごとに鶴1羽（その月の最初のご注文はさらに30羽）、' + FARM[pid][1] + '、ご友人へのギフトがひとつ届きます。'
      : 'In <a href="/farm/">Beju Farm</a>: 1 crane for every ¥100 (30 more on your first order each month), ' + FARM[pid][0] + ', and a gift for a friend.';
    row.parentNode.insertBefore(p, row.nextSibling);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", add); else add();
})();
