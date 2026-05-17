// WATonomous Humanoid Docs — Extra JS
// Subtle animations & helpers

document.addEventListener('DOMContentLoaded', () => {
  // ── Animate cards on scroll ──────────────────────────────
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
        }
      });
    },
    { threshold: 0.1 }
  );

  document.querySelectorAll('.wato-card').forEach((card) => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    observer.observe(card);
  });

  // ── Status badge shorthand ───────────────────────────────
  // Usage in markdown: <span data-status="wip"></span>
  document.querySelectorAll('[data-status]').forEach((el) => {
    const s = el.dataset.status;
    const labels = { wip: '🚧 WIP', done: '✅ Done', todo: '📋 Todo' };
    el.classList.add('status-badge', `status-${s}`);
    el.textContent = labels[s] || s;
  });
});
