// © 2026 Harry Winteringham. All rights reserved. Earwig is a trademark of Harry Winteringham. Unauthorised copying, modification or distribution of this file is prohibited.
// v2 page animations (GSAP + ScrollTrigger + SplitText).
(() => {
  const root = document.documentElement;
  if (!window.gsap || matchMedia('(prefers-reduced-motion: reduce)').matches) {
    root.classList.remove('js');
    return;
  }
  gsap.registerPlugin(ScrollTrigger, ScrollToPlugin, SplitText);
  const ease = 'expo.out';

  // Rise text up from behind a mask, line by line
  function riseLines(el, vars = {}) {
    const split = SplitText.create(el, { type: 'lines', mask: 'lines', linesClass: 'line' });
    gsap.set(el, { autoAlpha: 1 });
    return gsap.from(split.lines, { yPercent: 110, duration: 1.2, ease, stagger: 0.08, ...vars });
  }

  // Glide to a section instead of jumping
  function glideTo(id) {
    const target = document.getElementById(id);
    if (!target) return false;
    gsap.to(window, { scrollTo: { y: target, autoKill: true }, duration: 1.4, ease: 'power3.inOut' });
    history.replaceState(null, '', '#' + id);
    return true;
  }

  // Links: same page + #section glides there; another page fades out, then follows
  gsap.fromTo('body', { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.6, ease: 'power2.out' });
  document.querySelectorAll('a[href]').forEach(a => {
    if (a.target === '_blank' || a.dataset.play || a.dataset.subject) return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin) return;
    a.addEventListener('click', e => {
      if (e.metaKey || e.ctrlKey || e.shiftKey) return;
      const samePage = url.pathname === location.pathname ||
        (url.pathname.endsWith('/index.html') && location.pathname.endsWith('/'));
      if (samePage && url.hash) {
        if (glideTo(url.hash.slice(1))) e.preventDefault();
        return;
      }
      if (samePage) {
        e.preventDefault();
        gsap.to(window, { scrollTo: 0, duration: 1.2, ease: 'power3.inOut' });
        return;
      }
      e.preventDefault();
      gsap.to('body', { autoAlpha: 0, duration: 0.35, ease: 'power2.in', onComplete: () => { location.href = a.href; } });
    });
  });

  // Arriving from another page with #section: start at the top, then glide down to it
  if (location.hash && location.hash !== '#showreel' && document.getElementById(location.hash.slice(1))) {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    const id = location.hash.slice(1);
    scrollTo(0, 0);
    addEventListener('load', () => setTimeout(() => glideTo(id), 500));
  }
  // Back button restores the faded-out page from cache; show it again
  addEventListener('pageshow', e => { if (e.persisted) gsap.set('body', { autoAlpha: 1 }); });

  gsap.from('.nav > *', { y: -16, autoAlpha: 0, duration: 1, ease, delay: 0.2, stagger: 0.08 });

  document.fonts.ready.then(() => {
    // Home hero: footage fades in at its normal size, the line rises in, then drifts on scroll
    const hero = document.querySelector('.hero');
    if (hero) {
      gsap.from('.hero video', { autoAlpha: 0, duration: 1.4, ease: 'power2.out' });
      riseLines('.hero-line', { delay: 0.35 });
      // Explicit end + clearProps: the logos' CSS opacity/hover fade takes over again afterwards
      gsap.fromTo('.hero .laurels-quiet > *', { y: 14, autoAlpha: 0 }, {
        y: 0, autoAlpha: 0.8, duration: 1, ease, stagger: 0.08, delay: 0.9, clearProps: 'all',
      });
      gsap.to('.hero video', { yPercent: 18, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
    }

    // Project rows and cards: picture drifts through its frame, captions rise as they arrive
    document.querySelectorAll('.row').forEach(row => {
      gsap.fromTo(row.querySelector('.media'), { yPercent: -7 }, {
        yPercent: 7, ease: 'none',
        scrollTrigger: { trigger: row, start: 'top bottom', end: 'bottom top', scrub: true },
      });
      const text = row.querySelectorAll('.row-text h4, .row-text h3');
      gsap.set(row.querySelector('.row-text'), { autoAlpha: 1 });
      const split = SplitText.create(text, { type: 'lines', mask: 'lines' });
      gsap.from(split.lines, {
        yPercent: 110, duration: 1.1, ease, stagger: 0.07,
        scrollTrigger: { trigger: row, start: 'top 75%' },
      });
      const badges = row.querySelectorAll('.row-awards .award');
      // With a mouse the badges are revealed by hover (CSS); only animate them in on touch screens
      if (badges.length && !matchMedia('(hover: hover) and (pointer: fine)').matches) gsap.fromTo(badges, { y: 16, autoAlpha: 0 }, {
        y: 0, autoAlpha: 1, duration: 1, ease, stagger: 0.1, clearProps: 'transform',
        scrollTrigger: { trigger: row, start: 'top 75%' },
      });
    });

    // Project page: the hero fades in steady, then the play button pops in
    const pHero = document.querySelector('.p-hero');
    if (pHero) {
      const intro = gsap.timeline()
        .from(pHero.querySelector('.media'), { autoAlpha: 0, duration: 1.4, ease: 'power2.out' });
      const playBtn = pHero.querySelector('.play-btn');
      if (playBtn) intro.fromTo(playBtn, { scale: 0 }, { scale: 1, duration: 0.8, ease: 'back.out(1.8)', clearProps: 'transform' }, 0.7);
      riseLines('.p-info h4, .p-info h3', { delay: 0.5 });
      gsap.from('.p-body > *', { y: 30, autoAlpha: 0, duration: 1, ease, stagger: 0.1, delay: 0.7 });
      gsap.from('.more-head', { y: 30, autoAlpha: 0, duration: 1, ease, scrollTrigger: { trigger: '.more', start: 'top 85%' } });
    }

    // About page: statement rises in; everything marked .reveal fades up as it arrives
    // About line: word by word it fades in from a soft blur and comes into focus.
    // Bubbles take their place in the same sequence.
    const aboutLine = document.querySelector('.about-line');
    if (aboutLine) {
      SplitText.create(aboutLine, { type: 'words', wordsClass: 'word' });
      gsap.set(aboutLine, { autoAlpha: 1 });
      gsap.from(aboutLine.querySelectorAll('.word, .bubble'), {
        autoAlpha: 0, filter: 'blur(14px)',
        duration: 1.1, ease: 'power2.out', stagger: 0.07, delay: 0.3,
        clearProps: 'filter',
      });
    }
    gsap.utils.toArray('.reveal').forEach(el => {
      gsap.from(el, {
        y: 36, autoAlpha: 0, duration: 1, ease,
        scrollTrigger: { trigger: el, start: 'top 88%' },
      });
    });

    // Stills in the page gaps: they don't move; each one is sharpest at the middle of the screen
    // and softens the further it is from it, like a focus pull
    const dots = gsap.utils.toArray('.dot');
    if (dots.length) {
      const focus = () => {
        const mid = innerHeight / 2;
        dots.forEach(el => {
          const r = el.getBoundingClientRect();
          if (r.bottom < -200 || r.top > innerHeight + 200) return;
          const off = Math.abs(r.top + r.height / 2 - mid) / innerHeight;   // 0 at centre, ~0.5 at the edges
          const blur = Math.min(12, Math.max(0, (off - 0.12) * 30));
          el.style.filter = `blur(${blur.toFixed(1)}px)`;
          el.style.opacity = (1 - Math.min(0.5, Math.max(0, off - 0.12) * 1.1)).toFixed(2);
        });
      };
      addEventListener('scroll', focus, { passive: true });
      addEventListener('resize', focus);
      focus();
    }

    // Get in touch: words rise one after another (the bubbles pop in via CSS)
    gsap.from('.big-contact .w > span', {
      yPercent: 110, duration: 1.1, ease, stagger: 0.12,
      scrollTrigger: { trigger: '.big-contact', start: 'top 80%' },
    });
    gsap.from('.footer > *', {
      y: 24, autoAlpha: 0, duration: 1, ease, stagger: 0.08,
      scrollTrigger: { trigger: '.footer', start: 'top 90%' },
    });

    root.classList.remove('js');
  });
})();
