/* Beju site settings. Edit this one file; no other code needs to change. */
window.BEJU_CONFIG = {
  // Payments run through Stripe (see SETUP.md). The secret key is NOT here: it goes in Netlify's environment variables.
  stripe: {
    // Optional: your Stripe customer portal login link (Stripe Dashboard > Settings > Billing > Customer portal).
    // Shown to subscribers so they can pause, skip or cancel. Example: "https://billing.stripe.com/p/login/xxxx"
    portalLink: ""
  },
  // Seller details for the legal notice page (特定商取引法に基づく表記). Required in Japan before taking orders.
  // A sole trader may write "on-request" for address and phone (shown as: disclosed without delay on request).
  seller: {
    name: "Jordan Hipkiss (Beju Coffee Roasters / ベージュ コーヒー ロースターズ)",  // 販売業者 (sole trader: your name, with the trading name)
    manager: "Jordan Hipkiss",                  // 運営統括責任者
    address: "大阪府東大阪市東石切町4丁目9番地33",   // 所在地 (or "on-request")
    phone: "080-1880-9040",                     // 電話番号 (or "on-request")
    email: "hello@bejucoffee.com"               // メールアドレス
  },

  // Instagram direct-message link for "Order by message"
  instagramDM: "https://ig.me/m/bejucoffeeroasters",
  // Form endpoint that accepts a JSON POST and emails you (e.g. Formspree: "https://formspree.io/f/xxxxxxx"). Used by the contact form and the wholesale/training enquiry form. Empty = forms ask people to use Instagram.
  contactEndpoint: ""
};
