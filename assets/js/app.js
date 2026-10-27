/*
 * app.js
 * Loads the content files, keeps the page state (language, theme, slide,
 * work filter) and turns the content into the values the template uses.
 * To change TEXT or IMAGES, edit the files in content/ (or use Pages CMS),
 * not this file.
 */
(function () {
  var app = document.getElementById('app');
  var tpl = document.getElementById('tpl');

  var ICONS = {
    web: 'M5 4h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM3 8h18M9 21h6',
    ads: 'M3 11v2a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1zM15 9a4 4 0 0 1 0 6M18 6a8 8 0 0 1 0 12',
    social: 'M5 4h14a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM3 9h18M8 2v4M16 2v4M8 14h3M8 17h6',
    brand: 'M12 3l2.5 5 5.5.8-4 3.9.9 5.5L12 15.6 7.1 18.2 8 12.7 4 8.8 9.5 8z',
    video: 'M4 6h10a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2zM16 10l6-3v10l-6-3',
    seo: 'M11 4a7 7 0 1 1 0 14a7 7 0 1 1 0-14zM21 21l-4.5-4.5',
    event: 'M8 2v4M16 2v4M4 6h16a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1zM12 11l1.2 2.4 2.6.4-1.9 1.8.5 2.6-2.4-1.3-2.4 1.3.5-2.6-1.9-1.8 2.6-.4z',
    sign: 'M3 4h18v10H3zM8 14v7M16 14v7M7 8h10M7 11h6',
    booth: 'M3 21V9l9-6 9 6v12M3 21h18M7 21v-7h10v7M9 10h6',
    gift: 'M4 11h16v10H4zM2 7h20v4H2zM12 7v14M12 7c-2-4-6-4-6-1.5S9 7 12 7c3 0 6-.5 6-2.5S14 3 12 7z'
  };
  var SECTIONS = { story: '#story', services: '#services', work: '#work', packages: '#packages', faq: '#faq' };
  var WORKS_PER_PAGE = 9;
  var AR_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

  var content = {};
  var settings = {};
  var state = { slide: 0, filter: 'all', showAll: false, lang: null, theme: null, wipe: false };

  /* ---------- state + rendering ---------- */
  var pending = false;
  function setState(patch) {
    for (var k in patch) state[k] = patch[k];
    if (pending) return;
    pending = true;
    requestAnimationFrame(function () { pending = false; draw(); });
  }
  function draw() {
    SmartTemplate.render(app, tpl, values());
    var root = app.querySelector('.sm-root');
    if (root) {
      document.documentElement.lang = root.getAttribute('lang');
      document.documentElement.dir = root.getAttribute('dir');
    }
  }

  /* Page transition: color bands sweep across, then we jump / switch behind them. */
  function go(href, change) {
    return function (e) {
      if (e && e.preventDefault) e.preventDefault();
      if (state.wipe) return;
      var jump = function () {
        if (change) change();
        if (href) {
          var el = document.getElementById(href.slice(1));
          if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
        }
      };
      var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (still) { jump(); return; }
      setState({ wipe: true });
      setTimeout(jump, 470);
      setTimeout(function () { setState({ wipe: false }); }, 1200);
    };
  }

  /* Splits a sentence into words so each word can animate on its own. */
  function words(sentence, start) {
    return String(sentence || '').split(' ').filter(Boolean).map(function (txt, k) {
      return { txt: txt, d: (start + k * 0.12).toFixed(2) + 's', a: 4 + k * 5, b: 26 + k * 5 };
    });
  }
  function repeat(list, minLength) {
    var out = [];
    if (!list.length) return out;
    while (out.length < minLength) out = out.concat(list);
    return out.concat(out); // doubled so the scrolling strip loops seamlessly
  }
  function digits(n, arabic) {
    var s = (n < 10 ? '0' : '') + n;
    return arabic ? s.replace(/\d/g, function (d) { return AR_DIGITS[+d]; }) : s;
  }
  function cardClass(k, cols) { return 'rv lift d' + ((k % cols) + 1); }

  /* Opens WhatsApp with the form filled in (or calls the phone if no WhatsApp number is set). */
  function sendRequest(c) {
    return function () {
      var get = function (id) { var el = document.getElementById(id); return el ? el.value.trim() : ''; };
      var lines = [
        c.apply.whatsappIntro,
        c.apply.nameLabel + ': ' + get('f-name'),
        c.apply.phoneLabel + ': ' + get('f-phone'),
        c.apply.serviceLabel + ': ' + get('f-service'),
        c.apply.messageLabel + ': ' + get('f-msg')
      ];
      var wa = String(settings.whatsapp || '').replace(/\D/g, '');
      if (wa) window.open('https://wa.me/' + wa + '?text=' + encodeURIComponent(lines.join('\n')), '_blank', 'noopener');
      else if (settings.phone) window.location.href = 'tel:' + settings.phone;
    };
  }

  /* ---------- content → template values ---------- */
  function values() {
    var lang = state.lang || settings.defaultLanguage || 'ar';
    var theme = state.theme || settings.defaultTheme || 'dark';
    var c = content[lang];
    var ar = lang === 'ar';
    var light = theme === 'light';
    var accent = settings.accentColor || '#F6A528';
    var i = state.slide;
    var slidesData = c.hero.slides || [];
    var n = slidesData.length || 1;

    var t = {
      logoAlt: c.brand.logoAlt, brand: c.brand.name, brandSub: c.brand.tagline,
      navLabel: c.ui.menuLabel, langBtn: c.ui.languageButton, langAria: c.ui.switchLanguage,
      themeAria: light ? c.ui.darkMode : c.ui.lightMode,
      apply: c.nav.apply, prev: c.ui.previous, next: c.ui.next,
      cta: c.hero.button, cta2: c.hero.secondButton, tickPre: c.hero.tickerIntro,
      storyLbl: c.story.label, story1: c.story.paragraph1, story2: c.story.paragraph2,
      servLbl: c.services.label, procLbl: c.process.label,
      workLbl: c.work.label, workImg: c.ui.imagePlaceholder,
      packLbl: c.packages.label, popular: c.packages.popularBadge, choose: c.packages.button,
      cliLbl: c.clients.label, faqLbl: c.faq.label,
      applyText: c.apply.text, address: c.apply.address,
      fName: c.apply.nameLabel, fNamePh: c.apply.namePlaceholder, fPhone: c.apply.phoneLabel,
      fService: c.apply.serviceLabel, fMsg: c.apply.messageLabel, fMsgPh: c.apply.messagePlaceholder,
      send: c.apply.button, copy: c.footer.copyright, slogan: c.footer.slogan, waAria: c.ui.whatsapp,
      view: c.ui.view, more: c.ui.more, poBoxLabel: c.ui.poBoxLabel,
      fAbout: c.footer.about || '', fAreasT: c.footer.areasTitle || '', fPagesT: c.footer.pagesTitle || '',
      fContactT: c.footer.contactTitle || '', fFollowT: c.footer.followTitle || '', fTop: c.footer.backToTop || ''
    };
    var showPackages = settings.showPackages !== false;

    var slides = slidesData.map(function (s, k) {
      var w1 = words(s.line1, 0.1);
      return { active: k === i, eyebrow: s.eyebrow, w1: w1, w2: words(s.line2, 0.1 + w1.length * 0.12), text: s.text };
    });
    var dots = slidesData.map(function (s, k) {
      return {
        label: c.ui.slide + ' ' + (k + 1),
        go: function () { setState({ slide: k }); },
        active: k === i,
        w: k === i ? '48px' : '14px',
        bg: k === i ? (light ? 'rgba(11,22,34,0.15)' : 'rgba(255,255,255,0.22)') : (light ? 'rgba(11,22,34,0.25)' : 'rgba(255,255,255,0.3)')
      };
    });
    var navKeys = ['story', 'services', 'work', 'packages', 'faq'].filter(function (key) { return key !== 'packages' || showPackages; });
    var nav = navKeys.map(function (key) { return { label: c.nav[key], href: SECTIONS[key], go: go(SECTIONS[key]) }; });
    var tick = (c.hero.ticker || []).concat((c.hero.ticker || []).slice(0, 1)).map(function (x) { return { txt: x.text }; });

    var f = state.filter;
    var filters = (c.work.filters || []).map(function (flt) {
      var id = flt.id;
      var on = id === f;
      return {
        label: flt.label, selected: on ? 'true' : 'false', pick: function () { setState({ filter: id, showAll: false }); },
        bg: on ? (light ? '#0C6EB0' : '#46ABDC') : 'transparent',
        fg: on ? (light ? '#FFFFFF' : '#06202E') : 'var(--text)',
        bd: on ? (light ? '#0C6EB0' : '#46ABDC') : 'var(--cbd)', fw: on ? '700' : '400'
      };
    });
    var allWorks = (c.work.items || []).filter(function (w) { return f === 'all' || w.type === f; });
    var moreWorks = !state.showAll && allWorks.length > WORKS_PER_PAGE;
    var works = (moreWorks ? allWorks.slice(0, WORKS_PER_PAGE) : allWorks)
      .map(function (w, k) { return { name: w.name, cat: w.category, image: w.image || '', noImage: !w.image, link: w.link || '', cls: 'rv zoom d' + ((k % 3) + 1) }; });

    var packs = (c.packages.items || []).map(function (p, k) {
      var ft = !!p.featured;
      return {
        title: p.title, text: p.text, price: p.price, featured: ft,
        unit: p.monthly ? c.packages.perMonth : c.packages.currency,
        feats: (p.features || []).map(function (x) { return { txt: x.text }; }), cls: cardClass(k, 3),
        bg: ft ? '#8AC442' : 'var(--card)', bd: ft ? '#8AC442' : 'var(--cbd)', fg: ft ? '#0C1A0C' : 'var(--text)',
        hd: ft ? '#0C1A0C' : 'var(--head)', mu: ft ? '#1E3313' : 'var(--sm)',
        btnBg: ft ? '#0C1A0C' : 'transparent', btnBd: ft ? '#0C1A0C' : 'var(--acc)', btnFg: ft ? '#FFFFFF' : 'var(--head)'
      };
    });

    // Client logos: split into two scrolling rows (the second row moves the other way).
    var allLogos = (c.clients.logos || []).map(function (l) {
      return { name: l.name, image: l.image || '', noImage: !l.image, bg: l.image ? '#FFFFFF' : 'var(--card)', bd: l.image ? 'transparent' : 'var(--cbd)' };
    });
    var half = allLogos.length > 12 ? Math.ceil(allLogos.length / 2) : allLogos.length;
    var logos = repeat(allLogos.slice(0, half), 8);
    var logos2 = repeat(allLogos.slice(half), 8);
    var wa = String(settings.whatsapp || '').replace(/\D/g, '');

    return {
      accent: accent, lang: lang, dir: ar ? 'rtl' : 'ltr', t: t,
      themeClass: light ? 'sm-light' : 'sm-dark', isDark: !light, isLight: light,
      set: {
        logo: settings.logo || 'media/logo.png', art: settings.backgroundArt || 'media/logo-rays.svg',
        phone: settings.phone || '', phoneDisplay: settings.phoneDisplay || settings.phone || '',
        x: settings.xHandle || '', instagram: settings.instagram || '', tiktok: settings.tiktok || '',
        email: settings.email || '', poBox: settings.poBox || '',
        waNumber: wa ? (settings.whatsappDisplay || '+' + wa) : '',
        waLink: wa ? 'https://wa.me/' + wa : 'tel:' + (settings.phone || '')
      },
      showPackages: showPackages,
      toggleLang: go(null, function () { setState({ lang: ar ? 'en' : 'ar' }); }),
      toggleTheme: go(null, function () { setState({ theme: light ? 'dark' : 'light' }); }),
      goApply: go('#apply'), goStory: go('#story'), goTop: go('#top'),
      wipe: state.wipe,
      arrowBack: ar ? 'M9 6l6 6-6 6' : 'M15 6l-6 6 6 6',
      arrowFwd: ar ? 'M15 6l-6 6 6 6' : 'M9 6l6 6-6 6',
      nav: nav, footNav: nav.concat([{ label: c.nav.apply, href: '#apply', go: go('#apply') }]),
      areas: (c.footer.areas || []).map(function (a) { return { txt: a.text }; }),
      hasSocial: !!(settings.xHandle || settings.instagram || settings.tiktok),
      slides: slides, tick: tick, dots: dots,
      counter: digits(i + 1, ar) + ' / ' + digits(n, ar),
      prev: function () { setState({ slide: (i - 1 + n) % n }); },
      next: function () { setState({ slide: (i + 1) % n }); },
      strip: repeat((c.strips.top || []).map(function (x) { return { txt: x.text }; }), 7),
      strip2: repeat((c.strips.bottom || []).map(function (x) { return { txt: x.text }; }), 5),
      h: {
        story: words(c.story.title, 0), serv: words(c.services.title, 0), proc: words(c.process.title, 0),
        work: words(c.work.title, 0), pack: words(c.packages.title, 0), cli: words(c.clients.title, 0),
        faq: words(c.faq.title, 0), apply: words(c.apply.title, 0)
      },
      stats: (c.story.stats || []).map(function (s, k) { return { n: s.number, label: s.label, cls: cardClass(k, 4) }; }),
      values: (c.story.values || []).map(function (v, k) { return { title: v.title, text: v.text, cls: 'rv d' + ((k % 4) + 1) }; }),
      services: (c.services.items || []).map(function (s, k) { return { title: s.title, text: s.text, d: ICONS[s.icon] || ICONS.web, cls: cardClass(k, 3) }; }),
      steps: (c.process.steps || []).map(function (s, k) { return { title: s.title, text: s.text, n: digits(k + 1, ar), cls: cardClass(k, 4) }; }),
      filters: filters, works: works, packs: packs, logos: logos, logos2: logos2, hasLogos2: logos2.length > 0,
      moreWorks: moreWorks, showMore: function () { setState({ showAll: true }); },
      quotes: (c.clients.reviews || []).map(function (q, k) { return { text: q.text, name: q.name, biz: q.business, cls: cardClass(k, 3) }; }),
      faqs: (c.faq.items || []).map(function (q, k) { return { q: q.question, a: q.answer, cls: 'rv lift d' + ((k % 4) + 1) }; }),
      options: (c.apply.serviceOptions || []).map(function (o) { return { txt: o.text }; }),
      send: sendRequest(c)
    };
  }

  /* ---------- start ---------- */
  function load(path) {
    return fetch(path, { cache: 'no-cache' }).then(function (r) {
      if (!r.ok) throw new Error(path + ' ' + r.status);
      return r.json();
    });
  }
  Promise.all([load('content/ar.json'), load('content/en.json'), load('content/settings.json')])
    .then(function (res) {
      content = { ar: res[0], en: res[1] };
      settings = res[2];
      SmartTemplate.bindClicks(app);
      draw();
    })
    .catch(function (err) {
      console.error(err);
      app.innerHTML = '<div class="sm-loading">تعذّر تحميل محتوى الموقع. افتح الموقع عبر خادم ويب (انظر README).<br>Could not load the site content. Open the site through a web server (see README).</div>';
    });
})();
