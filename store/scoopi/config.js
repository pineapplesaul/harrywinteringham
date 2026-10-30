// Fill these in from the Supabase project (Settings → API). The anon key is public by design.
// Keep the prices in step with the PRICE_* and CREDITS_* secrets on the server (see LAUNCH.md).
window.SCOOPI = {
  supabaseUrl: "https://YOUR-PROJECT.supabase.co",
  anonKey: "YOUR-SUPABASE-ANON-KEY",
  prices: { scoopi: "£15", scoopiScans: 300, topup: "£5", topupScans: 200, free: 10 },
};

// Fills in any [data-price] on the page, so prices live in one place.
document.addEventListener("DOMContentLoaded", () => {
  const p = window.SCOOPI.prices;
  document.querySelectorAll("[data-price]").forEach((el) => {
    const value = p[el.dataset.price];
    if (value !== undefined) el.textContent = value;
  });
});
