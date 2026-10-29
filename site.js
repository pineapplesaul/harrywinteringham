// © 2026 Harry Winteringham. All rights reserved. Earwig is a trademark of Harry Winteringham. Unauthorised copying, modification or distribution of this file is prohibited.
// v2 site behaviour.

// Address assembled at runtime so it never appears in the static HTML for scrapers
const emailAddr = ['harry', 'winteringham'].join('.') + String.fromCharCode(64) + ['gmail', 'com'].join('.');
document.querySelectorAll('.email-addr').forEach(el => {
  el.textContent = emailAddr;
  el.dataset.t = emailAddr;
});
document.querySelectorAll('a[data-subject]').forEach(a => {
  a.href = 'mailto:' + emailAddr + '?subject=' + encodeURIComponent(a.dataset.subject);
});

// London clock in the footer
const clocks = document.querySelectorAll('.clock');
const tick = () => {
  const t = new Date().toLocaleTimeString('en-GB', { timeZone: 'Europe/London', hour12: false });
  clocks.forEach(c => { c.textContent = t; });
};
tick();
setInterval(tick, 1000);

// Loop clips. With a mouse, project rows show the still and play their clip on hover.
// On touch screens (no hover) and in the project-page hero, clips play while on screen.
const canHover = matchMedia('(hover: hover) and (pointer: fine)').matches;
const loops = document.querySelectorAll('video[data-src]');

function startClip(v) {
  if (!v.src) {
    v.src = v.dataset.src;
    v.addEventListener('playing', () => v.classList.add('ready'), { once: true });
  } else {
    v.classList.add('ready');
  }
  v.play().catch(() => {});
}

function stopClip(v) {
  v.classList.remove('ready');
  v.pause();
}

const io = new IntersectionObserver(entries => {
  entries.forEach(({ target: v, isIntersecting }) => {
    if (isIntersecting) startClip(v);
    else if (v.src) v.pause();
  });
}, { rootMargin: '200px 0px' });

loops.forEach(v => {
  const row = v.closest('.row');
  if (row && canHover) {
    row.addEventListener('mouseenter', () => startClip(v));
    row.addEventListener('mouseleave', () => stopClip(v));
  } else {
    io.observe(v);
  }
});

if (canHover) {
  document.querySelectorAll('.row[data-hover-youtube]').forEach(row => {
    let timer;
    row.addEventListener('mouseenter', () => {
      // Short delay so sweeping the mouse down the page doesn't load every trailer
      timer = setTimeout(() => {
        const f = document.createElement('iframe');
        f.className = 'row-yt';
        f.src = 'https://www.youtube.com/embed/' + row.dataset.hoverYoutube +
          '?autoplay=1&mute=1&controls=0&loop=1&playlist=' + row.dataset.hoverYoutube +
          '&rel=0&modestbranding=1&playsinline=1&iv_load_policy=3';
        f.allow = 'autoplay; encrypted-media';
        f.tabIndex = -1;
        f.addEventListener('load', () => setTimeout(() => f.classList.add('ready'), 600), { once: true });
        row.insertBefore(f, row.querySelector('.row-text'));
      }, 300);
    });
    row.addEventListener('mouseleave', () => {
      clearTimeout(timer);
      row.querySelector('.row-yt')?.remove();
    });
  });
}

// Inline clip bubbles pop in once their line is on screen
const bubbleObs = new IntersectionObserver((entries, obs) => {
  entries.forEach(({ target, isIntersecting }) => {
    if (!isIntersecting) return;
    target.classList.add('in');
    obs.unobserve(target);
  });
}, { threshold: 0.5 });
document.querySelectorAll('.has-bubbles').forEach(el => bubbleObs.observe(el));

// Full-bleed player
const player = document.querySelector('.player');
const stage = player.querySelector('.player-stage');

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

// Clip the player to the clicked element's box so it grows from there and shrinks back into it
function setOrigin(el) {
  const r = el.getBoundingClientRect();
  const radius = el.classList.contains('play-btn') ? r.width / 2 : 4;
  player.style.setProperty('--from',
    `inset(${r.top}px ${innerWidth - r.right}px ${innerHeight - r.bottom}px ${r.left}px round ${radius}px)`);
}

function openPlayer(src, youtube, fromEl) {
  if (fromEl) setOrigin(fromEl);
  player._from = fromEl;
  if (youtube) {
    stage.innerHTML = '<iframe src="https://www.youtube.com/embed/' + youtube +
      '?autoplay=1&rel=0&modestbranding=1&playsinline=1" allow="autoplay; fullscreen; encrypted-media" allowfullscreen></iframe>';
  } else {
    const v = document.createElement('video');
    v.src = src;
    v.controls = true;
    v.autoplay = true;
    v.playsInline = true;
    stage.replaceChildren(v);
  }
  player.hidden = false;
  player.getBoundingClientRect(); // commit the start clip before animating
  player.classList.add('open');
  document.body.style.overflow = 'hidden';
  document.querySelectorAll('video[data-src]').forEach(v => v.pause());
}

function closePlayer() {
  const finish = () => {
    stage.replaceChildren();
    player.hidden = true;
    document.body.style.overflow = '';
    loops.forEach(v => { if (v.src) v.play().catch(() => {}); });
  };
  const v = stage.querySelector('video');
  if (v) v.pause();
  if (player._from) setOrigin(player._from);
  player.classList.remove('open');
  if (reducedMotion) return finish();
  player.addEventListener('transitionend', function done(e) {
    if (e.target !== player || e.propertyName !== 'clip-path') return;
    player.removeEventListener('transitionend', done);
    finish();
  });
}

document.querySelectorAll('[data-play], [data-youtube]').forEach(el => {
  el.addEventListener('click', e => {
    e.preventDefault();
    openPlayer(el.dataset.play, el.dataset.youtube, el);
  });
});
player.querySelector('.player-close').addEventListener('click', closePlayer);
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !player.hidden) closePlayer(); });

// Deep link: /#showreel opens the showreel
const reel = document.querySelector('[data-play$="showreel.mp4"]');
if (location.hash === '#showreel' && reel) reel.click();
