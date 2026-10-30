// The Supabase project (Settings → API Keys). The publishable key is public by design.
// Keep the prices in step with the PRICE_* and CREDITS_* secrets on the server (see LAUNCH.md).
window.SCOOPI = {
  supabaseUrl: "https://jzhxfzqnntlduzmvomob.supabase.co",
  anonKey: "sb_publishable_RJjOCac66qNmfvstBHwTpQ_zETKQ2g1",
  prices: { scoopi: "£19", scoopiScans: 300, topup: "£5", topupScans: 100, free: 10 },
  // Cloudflare Turnstile's site key (public), for the "not a robot" check on sign-in. Empty leaves it off.
  // Add it here and publish before switching on CAPTCHA in Supabase, or sign-in stops working (see LAUNCH.md).
  captchaSiteKey: "",
};

// Fills in any [data-price] on the page, so prices live in one place.
document.addEventListener("DOMContentLoaded", () => {
  const p = window.SCOOPI.prices;
  document.querySelectorAll("[data-price]").forEach((el) => {
    const value = p[el.dataset.price];
    if (value !== undefined) el.textContent = value;
  });
});
