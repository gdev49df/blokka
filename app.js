/* blokka — блочный конструктор сайтов.
   работает целиком в браузере, подходит для github pages. */
'use strict';

const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const uid = () => 'b' + Math.random().toString(36).slice(2, 8);
const digits = s => String(s || '').replace(/\D/g, '');
const nick = s => String(s || '').trim().replace(/^https?:\/\/(t\.me|instagram\.com)\//, '').replace(/^@/, '').replace(/\/+$/, '');
const cssUrl = u => esc(String(u).replace(/'/g, '%27').replace(/"/g, '%22').replace(/\(/g, '%28').replace(/\)/g, '%29'));
const clone = o => JSON.parse(JSON.stringify(o));
const ext = href => /^https?:/.test(href) ? ' target="_blank" rel="noopener"' : '';

/* ---------- темы ---------- */

const THEMES = {
  sky:   { name: 'небо',    bg: '#f5f9fc', fg: '#12263a', card: '#ffffff', muted: '#5d7185', accent: '#1a8fd1', radius: 16, dark: false },
  sun:   { name: 'солнце',  bg: '#fffaf0', fg: '#2a2217', card: '#ffffff', muted: '#7a6a52', accent: '#f08a24', radius: 20, dark: false },
  neon:  { name: 'неон',    bg: '#0d0d14', fg: '#f1f1f7', card: '#171724', muted: '#9a9ab3', accent: '#8b5cf6', radius: 14, dark: true },
  brick: { name: 'кирпич',  bg: '#fff6ee', fg: '#2b1d14', card: '#ffffff', muted: '#85685a', accent: '#d9602b', radius: 22, dark: false }
};

/* ---------- блоки: поля редактора ---------- */

const TITLE = { k: 'title', l: 'заголовок', t: 'text' };

const BLOCKS = {
  hero: {
    name: 'обложка', icon: '🖼️', menu: null,
    defaults: () => ({ title: 'название бизнеса', sub: 'коротко о том, чем вы полезны клиентам', cta: 'связаться', image: '' }),
    fields: [
      TITLE,
      { k: 'sub', l: 'подзаголовок', t: 'textarea', rows: 3 },
      { k: 'cta', l: 'текст кнопки', t: 'text' },
      { k: 'image', l: 'фоновое фото', t: 'image' }
    ]
  },
  about: {
    name: 'о нас', icon: '💬', menu: 'о нас',
    defaults: () => ({ title: 'о нас', text: 'расскажите о себе: чем занимаетесь, чем отличаетесь, почему вам доверяют.', image: '' }),
    fields: [
      TITLE,
      { k: 'text', l: 'текст', t: 'textarea', rows: 5 },
      { k: 'image', l: 'фото', t: 'image' }
    ]
  },
  services: {
    name: 'услуги и цены', icon: '💰', menu: 'услуги',
    defaults: () => ({ title: 'услуги и цены', items: [
      { title: 'услуга 1', price: '5 000 ₸', desc: '' },
      { title: 'услуга 2', price: '10 000 ₸', desc: '' },
      { title: 'услуга 3', price: '15 000 ₸', desc: '' }
    ] }),
    fields: [
      TITLE,
      { k: 'items', t: 'list', l: 'услуги', add: '+ услуга', label: i => i.title || 'услуга',
        sub: [
          { k: 'title', l: 'название', t: 'text' },
          { k: 'price', l: 'цена', t: 'text' },
          { k: 'desc', l: 'описание', t: 'textarea', rows: 2 }
        ] }
    ]
  },
  gallery: {
    name: 'галерея', icon: '📷', menu: 'галерея',
    defaults: () => ({ title: 'галерея', items: [{ image: '' }, { image: '' }, { image: '' }] }),
    fields: [
      TITLE,
      { k: 'items', t: 'list', l: 'фото', add: '+ фото', label: (i, n) => 'фото ' + (n + 1),
        sub: [{ k: 'image', l: 'фото', t: 'image' }] }
    ]
  },
  reviews: {
    name: 'отзывы', icon: '⭐', menu: 'отзывы',
    defaults: () => ({ title: 'отзывы', items: [
      { name: 'имя клиента', text: 'здесь будет отзыв клиента о вашей работе.' },
      { name: 'имя клиента', text: 'ещё один отзыв, лучше с конкретным результатом.' }
    ] }),
    fields: [
      TITLE,
      { k: 'items', t: 'list', l: 'отзывы', add: '+ отзыв', label: i => i.name || 'отзыв',
        sub: [
          { k: 'name', l: 'имя', t: 'text' },
          { k: 'text', l: 'отзыв', t: 'textarea', rows: 3 }
        ] }
    ]
  },
  faq: {
    name: 'вопросы и ответы', icon: '❓', menu: 'вопросы',
    defaults: () => ({ title: 'частые вопросы', items: [
      { q: 'как записаться?', a: 'напишите нам в whatsapp или позвоните.' },
      { q: 'где вы находитесь?', a: 'адрес указан в разделе «контакты».' }
    ] }),
    fields: [
      TITLE,
      { k: 'items', t: 'list', l: 'вопросы', add: '+ вопрос', label: i => i.q || 'вопрос',
        sub: [
          { k: 'q', l: 'вопрос', t: 'text' },
          { k: 'a', l: 'ответ', t: 'textarea', rows: 3 }
        ] }
    ]
  },
  cta: {
    name: 'призыв к действию', icon: '📣', menu: null,
    defaults: () => ({ title: 'готовы начать?', text: 'напишите нам, и мы всё расскажем.', button: 'написать в whatsapp' }),
    fields: [
      TITLE,
      { k: 'text', l: 'текст', t: 'textarea', rows: 2 },
      { k: 'button', l: 'текст кнопки', t: 'text' }
    ]
  },
  contacts: {
    name: 'контакты', icon: '📍', menu: 'контакты',
    defaults: () => ({ title: 'контакты', note: '' }),
    fields: [
      TITLE,
      { k: 'note', l: 'заметка (необязательно)', t: 'textarea', rows: 2 },
      { k: '_hint', t: 'hint', l: 'телефон, адрес и мессенджеры заполняются на вкладке «сайт»' }
    ]
  }
};

/* ---------- готовые шаблоны ---------- */

function preset(o) {
  return {
    title: o.title, sub: o.sub,
    site: { name: o.name, theme: o.theme, hours: o.hours },
    blocks: [
      { type: 'hero', data: { title: o.name, sub: o.tagline, cta: o.cta, image: '' } },
      { type: 'about', data: { title: 'о нас', text: o.about, image: '' } },
      { type: 'services', data: { title: 'услуги и цены', items: o.services.map(([title, price, desc]) => ({ title, price, desc: desc || '' })) } },
      { type: 'gallery', data: { title: 'галерея', items: [{ image: '' }, { image: '' }, { image: '' }] } },
      { type: 'reviews', data: { title: 'отзывы', items: o.reviews.map(([name, text]) => ({ name, text })) } },
      { type: 'faq', data: { title: 'частые вопросы', items: o.faq.map(([q, a]) => ({ q, a })) } },
      { type: 'cta', data: { title: o.ctaTitle, text: o.ctaText, button: o.cta } },
      { type: 'contacts', data: { title: 'контакты', note: '' } }
    ]
  };
}

const PRESETS = {
  clinic: preset({
    title: 'клиника', sub: 'светлый и спокойный', theme: 'sky', hours: 'пн–сб 09:00–20:00',
    name: 'стоматология «улыбка»', tagline: 'лечим без боли и заботимся о вашей улыбке',
    cta: 'записаться на приём',
    about: 'современная клиника в центре города. опытные врачи, цифровая диагностика и честные цены без скрытых доплат.',
    services: [['консультация', 'бесплатно', 'осмотр и план лечения'], ['лечение кариеса', 'от 15 000 ₸'], ['профессиональная чистка', '18 000 ₸'], ['отбеливание', '45 000 ₸']],
    reviews: [['айгерим', 'вылечили зуб без боли, объяснили каждый шаг. рекомендую.'], ['марат', 'приятная атмосфера и честная цена, пришёл по рекомендации друга.']],
    faq: [['нужна ли запись заранее?', 'да, так мы сможем уделить вам достаточно времени.'], ['есть ли гарантия на лечение?', 'да, гарантия зависит от вида услуги, подробности скажет врач.']],
    ctaTitle: 'запишитесь на бесплатную консультацию', ctaText: 'ответим на вопросы и подберём время, которое удобно вам.'
  }),
  school: preset({
    title: 'школа / курсы', sub: 'тёплый и дружелюбный', theme: 'sun', hours: 'пн–сб 09:00–21:00',
    name: 'english school', tagline: 'заговорите на английском за 6 месяцев',
    cta: 'записаться на пробный урок',
    about: 'небольшие группы, живые преподаватели и разговорная практика на каждом занятии. первый урок бесплатно.',
    services: [['группа для взрослых', '28 000 ₸/мес', '2 раза в неделю'], ['группа для детей', '24 000 ₸/мес'], ['индивидуально', '6 000 ₸/урок'], ['подготовка к ielts', '35 000 ₸/мес']],
    reviews: [['динара, мама ученика', 'ребёнок бежит на занятия с удовольствием, уже заговорил.'], ['асхат', 'за полгода поднял уровень с нуля до b1, преподаватели супер.']],
    faq: [['с какого возраста берёте детей?', 'с 5 лет, группы формируются по возрасту.'], ['как проходит пробный урок?', 'знакомимся, определяем уровень и подбираем группу.']],
    ctaTitle: 'первый урок бесплатно', ctaText: 'запишитесь, и мы подберём группу под ваш уровень.'
  }),
  club: preset({
    title: 'клуб / игры', sub: 'тёмный и неоновый', theme: 'neon', hours: 'круглосуточно',
    name: 'cyber club', tagline: 'мощные пк, быстрый интернет и своя атмосфера',
    cta: 'забронировать место',
    about: 'игровые зоны, vip-комнаты и буткемп для турниров. работаем круглосуточно, бронь через whatsapp.',
    services: [['стандарт', '1 000 ₸/час'], ['vip', '1 500 ₸/час'], ['ночной пакет', '4 500 ₸'], ['буткемп на 5 человек', '7 000 ₸/час']],
    reviews: [['тимур', 'пинг низкий, железо мощное, на турнир собрались всей командой.'], ['данияр', 'чисто, удобные кресла, бронь прошла за минуту.']],
    faq: [['можно ли забронировать заранее?', 'да, напишите в whatsapp и назовите время.'], ['есть ли скидки?', 'ночной пакет и абонементы выходят выгоднее почасовой оплаты.']],
    ctaTitle: 'собирай команду и приходи', ctaText: 'бронь места занимает минуту.'
  }),
  cafe: preset({
    title: 'кафе / еда', sub: 'уютный и аппетитный', theme: 'brick', hours: 'ежедневно 10:00–23:00',
    name: 'кафе «уют»', tagline: 'вкусно, быстро и по-домашнему',
    cta: 'заказать',
    about: 'готовим из свежих продуктов каждый день. есть доставка по городу и бронирование столов.',
    services: [['шаурма классическая', '1 800 ₸'], ['бургер', '2 400 ₸'], ['кофе', 'от 900 ₸'], ['бизнес-ланч', '2 900 ₸']],
    reviews: [['алина', 'очень вкусно и быстро, доставили горячим.'], ['руслан', 'часто заказываем в офис, порции большие.']],
    faq: [['есть ли доставка?', 'да, по всему городу, время и стоимость уточняйте при заказе.'], ['можно ли заказать на мероприятие?', 'да, напишите нам за день.']],
    ctaTitle: 'проголодались?', ctaText: 'закажите прямо сейчас, доставим горячим.'
  })
};

/* ---------- состояние ---------- */

const defaultSite = () => ({
  name: 'мой сайт', theme: 'sky', accent: '',
  phone: '', whatsapp: '', telegram: '', instagram: '', address: '', hours: '', map: '',
  showSign: true, floatWa: true
});

function fromPreset(id, keep) {
  const p = PRESETS[id];
  return {
    site: Object.assign(defaultSite(), p.site, keep || {}),
    blocks: p.blocks.map(b => ({ id: uid(), type: b.type, data: clone(b.data) })),
    selected: null
  };
}

function normalize(o) {
  if (!o || !Array.isArray(o.blocks) || !o.site) return null;
  const site = Object.assign(defaultSite(), o.site);
  if (!THEMES[site.theme]) site.theme = 'sky';
  const blocks = o.blocks.filter(b => b && BLOCKS[b.type]).map(b => ({
    id: b.id || uid(), type: b.type, data: Object.assign(BLOCKS[b.type].defaults(), b.data || {})
  }));
  return { site, blocks, selected: null };
}

function load() {
  try { return normalize(JSON.parse(localStorage.getItem('blokka') || 'null')); } catch (e) { return null; }
}

let state = load() || fromPreset('clinic');
let paletteOpen = false;

function save() {
  try { localStorage.setItem('blokka', JSON.stringify({ site: state.site, blocks: state.blocks })); }
  catch (e) { toast('не хватило места в браузере, сохрани проект в файл'); }
}

const findBlock = id => state.blocks.find(b => b.id === id);

/* ---------- генерация сайта ---------- */

function ctaHref(st) {
  const s = st.site;
  if (digits(s.whatsapp)) return 'https://wa.me/' + digits(s.whatsapp);
  if (nick(s.telegram)) return 'https://t.me/' + nick(s.telegram);
  if (digits(s.phone)) return 'tel:' + String(s.phone).replace(/[^\d+]/g, '');
  const c = st.blocks.find(b => b.type === 'contacts');
  return c ? '#' + c.id : '#';
}

const at = (b, c) => `id="${b.id}"${c.pv ? ` data-bid="${b.id}"` : ''}`;

const RENDER = {
  hero(b, s, c) {
    const d = b.data;
    const ov = c.t.dark ? 'rgba(10,10,18,.72),rgba(10,10,18,.88)' : 'rgba(255,255,255,.72),rgba(255,255,255,.9)';
    const st = d.image ? ` style="background-image:linear-gradient(${ov}),url('${cssUrl(d.image)}')"` : '';
    return `<header ${at(b, c)} class="hero${d.image ? ' has-img' : ''}"${st}><div class="wrap">
  <h1>${esc(d.title)}</h1>${d.sub ? `\n  <p>${esc(d.sub)}</p>` : ''}${d.cta ? `\n  <a class="btn" href="${esc(c.cta)}"${ext(c.cta)}>${esc(d.cta)}</a>` : ''}
</div></header>`;
  },

  about(b, s, c) {
    const d = b.data;
    return `<section ${at(b, c)}><div class="wrap"><div class="about${d.image ? ' two' : ''}">
  <div>${d.title ? `<h2>${esc(d.title)}</h2>` : ''}<p>${esc(d.text)}</p></div>${d.image ? `\n  <img src="${esc(d.image)}" alt="">` : ''}
</div></div></section>`;
  },

  services(b, s, c) {
    const d = b.data;
    const items = (d.items || []).filter(i => i.title || i.price);
    return `<section ${at(b, c)}><div class="wrap">${d.title ? `<h2>${esc(d.title)}</h2>` : ''}<div class="grid">
${items.map(i => `  <div class="card"><h4>${esc(i.title)}</h4>${i.price ? `<div class="price">${esc(i.price)}</div>` : ''}${i.desc ? `<p>${esc(i.desc)}</p>` : ''}</div>`).join('\n')}
</div></div></section>`;
  },

  gallery(b, s, c) {
    const d = b.data;
    const items = (d.items || []).filter(i => i.image || c.pv);
    if (!items.length) return '';
    return `<section ${at(b, c)}><div class="wrap">${d.title ? `<h2>${esc(d.title)}</h2>` : ''}<div class="gal">
${items.map(i => i.image ? `  <img src="${esc(i.image)}" alt="" loading="lazy">` : '  <div class="ph">фото</div>').join('\n')}
</div></div></section>`;
  },

  reviews(b, s, c) {
    const d = b.data;
    const items = (d.items || []).filter(i => i.text);
    return `<section ${at(b, c)}><div class="wrap">${d.title ? `<h2>${esc(d.title)}</h2>` : ''}<div class="grid">
${items.map(i => `  <div class="card rev"><q>${esc(i.text)}</q>${i.name ? `<small>${esc(i.name)}</small>` : ''}</div>`).join('\n')}
</div></div></section>`;
  },

  faq(b, s, c) {
    const d = b.data;
    const items = (d.items || []).filter(i => i.q);
    return `<section ${at(b, c)}><div class="wrap">${d.title ? `<h2>${esc(d.title)}</h2>` : ''}
${items.map(i => `  <details><summary>${esc(i.q)}</summary><p>${esc(i.a)}</p></details>`).join('\n')}
</div></section>`;
  },

  cta(b, s, c) {
    const d = b.data;
    return `<section ${at(b, c)}><div class="wrap"><div class="banner">
  <h2>${esc(d.title)}</h2>${d.text ? `<p>${esc(d.text)}</p>` : ''}${d.button ? `<a class="btn" href="${esc(c.cta)}"${ext(c.cta)}>${esc(d.button)}</a>` : ''}
</div></div></section>`;
  },

  contacts(b, s, c) {
    const d = b.data;
    const links = [];
    if (s.phone) links.push(`<a href="tel:${esc(String(s.phone).replace(/[^\d+]/g, ''))}">${esc(s.phone)}</a>`);
    if (digits(s.whatsapp)) links.push(`<a href="https://wa.me/${digits(s.whatsapp)}" target="_blank" rel="noopener">whatsapp</a>`);
    if (nick(s.telegram)) links.push(`<a href="https://t.me/${esc(nick(s.telegram))}" target="_blank" rel="noopener">telegram</a>`);
    if (nick(s.instagram)) links.push(`<a href="https://instagram.com/${esc(nick(s.instagram))}" target="_blank" rel="noopener">instagram</a>`);
    const rows = [];
    if (s.address) rows.push(`<div>📍 ${esc(s.address)}${s.map ? ` — <a href="${esc(s.map)}" target="_blank" rel="noopener">на карте</a>` : ''}</div>`);
    if (s.hours) rows.push(`<div>🕒 ${esc(s.hours)}</div>`);
    if (d.note) rows.push(`<div class="note">${esc(d.note)}</div>`);
    if (links.length) rows.push(`<div class="links">${links.join('')}</div>`);
    if (!rows.length && c.pv) rows.push('<div class="note">заполните контакты на вкладке «сайт»</div>');
    return `<section ${at(b, c)}><div class="wrap">${d.title ? `<h2>${esc(d.title)}</h2>` : ''}<div class="card contacts-card">
${rows.join('\n')}
</div></div></section>`;
  }
};

function siteCSS(t, accent, pv) {
  const nav = t.dark ? 'rgba(13,13,20,.85)' : 'rgba(255,255,255,.85)';
  const line = t.dark ? '#ffffff14' : '#00000010';
  return `:root{--bg:${t.bg};--fg:${t.fg};--card:${t.card};--muted:${t.muted};--accent:${accent};--r:${t.radius}px}
*{box-sizing:border-box}
html{scroll-behavior:${pv ? 'auto' : 'smooth'}}
body{margin:0;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;background:var(--bg);color:var(--fg);line-height:1.55}
img{max-width:100%;display:block}
.wrap{max-width:1000px;margin:0 auto;padding:0 20px}
nav{position:sticky;top:0;z-index:5;background:${nav};backdrop-filter:blur(10px);border-bottom:1px solid ${line}}
nav .wrap{display:flex;justify-content:space-between;align-items:center;height:60px}
nav b{font-size:18px}
nav a{color:var(--fg);text-decoration:none;margin-left:18px;font-size:14px;opacity:.8}
.hero{padding:96px 0 80px;background:radial-gradient(900px 400px at 80% -10%,${accent}33,transparent 60%),var(--bg)}
.hero.has-img{background-size:cover;background-position:center}
.hero h1{font-size:clamp(32px,6vw,56px);line-height:1.1;margin:0 0 14px}
.hero p{font-size:18px;color:var(--muted);max-width:560px;margin:0 0 28px;white-space:pre-line}
.btn{display:inline-block;background:var(--accent);color:#fff;text-decoration:none;font-weight:600;padding:14px 26px;border-radius:calc(var(--r) - 4px);box-shadow:0 8px 24px ${accent}55}
section{padding:52px 0}
h2{font-size:28px;margin:0 0 22px}
.about{display:grid;grid-template-columns:1fr;gap:28px;align-items:center}
.about.two{grid-template-columns:1.2fr 1fr}
.about h2{margin-bottom:14px}
.about p{color:var(--muted);font-size:17px;margin:0;white-space:pre-line}
.about img{border-radius:var(--r);width:100%;max-height:380px;object-fit:cover}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:14px}
.card{background:var(--card);border-radius:var(--r);padding:20px;border:1px solid ${line}}
.card h4{margin:0 0 6px;font-size:17px}
.price{color:var(--accent);font-weight:700;font-size:18px}
.card p{margin:6px 0 0;color:var(--muted);font-size:14px;white-space:pre-line}
.gal{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:10px}
.gal img,.gal .ph{width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:var(--r)}
.ph{background:${line};display:grid;place-items:center;color:var(--muted);font-size:13px}
.rev q{display:block;quotes:none;font-size:16px}
.rev small{display:block;margin-top:12px;color:var(--muted);font-weight:600}
details{background:var(--card);border:1px solid ${line};border-radius:calc(var(--r) - 4px);padding:14px 18px;margin-bottom:10px}
summary{cursor:pointer;font-weight:600}
details p{color:var(--muted);margin:10px 0 0;white-space:pre-line}
.banner{background:var(--accent);color:#fff;border-radius:var(--r);padding:44px 28px;text-align:center}
.banner h2{margin:0 0 8px}
.banner p{margin:0 0 22px;opacity:.9}
.banner .btn{background:#fff;color:var(--accent);box-shadow:none}
.contacts-card{display:grid;gap:10px}
.contacts-card a{color:var(--accent);text-decoration:none;font-weight:600}
.contacts-card .note{color:var(--muted);white-space:pre-line}
.links{display:flex;gap:16px;flex-wrap:wrap}
footer{padding:28px 0 40px;text-align:center;color:var(--muted);font-size:13px}
.fab{position:fixed;right:18px;bottom:18px;z-index:6;width:56px;height:56px;border-radius:50%;background:#25d366;color:#fff;display:grid;place-items:center;font-size:26px;text-decoration:none;box-shadow:0 8px 24px #0004}
@media(max-width:700px){nav a{display:none}.hero{padding:64px 0 52px}.about.two{grid-template-columns:1fr}}${pv ? '\n[data-bid]{cursor:pointer}\n.sel{outline:3px solid #1a73e8;outline-offset:-3px}' : ''}`;
}

const PREVIEW_JS = `
document.addEventListener('click', function (e) {
  var a = e.target.closest('a[href^="#"]');
  if (a) {
    e.preventDefault();
    var t = document.getElementById(a.getAttribute('href').slice(1));
    if (t) t.scrollIntoView({ behavior: 'smooth' });
  }
  var b = e.target.closest('[data-bid]');
  if (b) { e.preventDefault(); parent.postMessage({ blokka: 'select', id: b.dataset.bid }, '*'); }
}, true);
window.addEventListener('message', function (e) {
  var d = e.data;
  if (!d || d.blokka !== 'hl') return;
  var old = document.querySelector('.sel');
  if (old) old.classList.remove('sel');
  if (!d.id) return;
  var el = document.querySelector('[data-bid="' + d.id + '"]');
  if (el) { el.classList.add('sel'); if (d.scroll) el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
});`;

const MENU_LABEL = { about: 'о нас', services: 'услуги', gallery: 'галерея', reviews: 'отзывы', faq: 'вопросы', contacts: 'контакты' };

function buildSite(st, pv) {
  const s = st.site;
  const t = THEMES[s.theme] || THEMES.sky;
  const accent = s.accent || t.accent;
  const c = { pv: !!pv, t, cta: ctaHref(st) };

  const seen = {};
  const menu = [];
  st.blocks.forEach(b => {
    const label = BLOCKS[b.type].menu;
    if (!label || seen[b.type]) return;
    seen[b.type] = true;
    if (b.type === 'gallery' && !pv && !(b.data.items || []).some(i => i.image)) return;
    menu.push(`<a href="#${b.id}">${label}</a>`);
  });

  const hero = st.blocks.find(b => b.type === 'hero');
  const desc = hero && hero.data.sub ? hero.data.sub : s.name;
  const body = st.blocks.map(b => RENDER[b.type](b, s, c)).filter(Boolean).join('\n\n');
  const fab = s.floatWa && digits(s.whatsapp)
    ? `\n<a class="fab" href="https://wa.me/${digits(s.whatsapp)}" target="_blank" rel="noopener" aria-label="whatsapp">💬</a>` : '';
  const sign = s.showSign ? '<br>Создано @bauyrzhanov_12_' : '';

  return `<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(s.name)}</title>
<meta name="description" content="${esc(desc)}">
<style>
${siteCSS(t, accent, pv)}
</style>
</head>
<body>
<nav><div class="wrap"><b>${esc(s.name)}</b><div>${menu.join('')}</div></div></nav>

${body}

<footer><div class="wrap">© ${new Date().getFullYear()} ${esc(s.name)}${sign}</div></footer>${fab}${pv ? `\n<script>${PREVIEW_JS}</script>` : ''}
</body>
</html>`;
}

/* ---------- превью ---------- */

const frame = $('#frame');
let previewTimer = null;
let keepScroll = 0;
let scrollToSel = false;

function renderPreview(now) {
  clearTimeout(previewTimer);
  const run = () => {
    try { keepScroll = frame.contentWindow.scrollY || 0; } catch (e) { keepScroll = 0; }
    frame.srcdoc = buildSite(state, true);
  };
  if (now) run(); else previewTimer = setTimeout(run, 150);
}

function highlight(id, scroll) {
  try { frame.contentWindow.postMessage({ blokka: 'hl', id: id || '', scroll: !!scroll }, '*'); } catch (e) {}
}

frame.addEventListener('load', () => {
  if (!scrollToSel) { try { frame.contentWindow.scrollTo(0, keepScroll); } catch (e) {} }
  highlight(state.selected, scrollToSel);
  scrollToSel = false;
});

window.addEventListener('message', e => {
  const d = e.data;
  if (e.source !== frame.contentWindow || !d || d.blokka !== 'select') return;
  if (!findBlock(d.id)) return;
  setTab('blocks');
  state.selected = d.id;
  renderBlocksTab();
  highlight(d.id, false);
  const open = $('.bcard.open');
  if (open) open.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
});

/* ---------- панель: блоки ---------- */

function attrs(p) {
  return `data-bid="${esc(p.bid)}" data-k="${esc(p.k)}"${p.i != null ? ` data-i="${p.i}" data-sk="${esc(p.sk || '')}"` : ''}`;
}

function imageHTML(f, val, p) {
  const a = attrs(p);
  const thumb = val ? `style="background-image:url('${cssUrl(val)}')"` : '';
  return `<div class="imgf"><span class="imgl">${esc(f.l)}</span><div class="imgrow">
    <div class="thumb" ${thumb}>${val ? '' : 'нет фото'}</div>
    <div class="imgbtns">
      <label class="mini">загрузить<input type="file" accept="image/*" hidden ${a} data-up></label>
      <button class="mini" data-act="imgurl" ${a}>ссылка</button>${val ? `\n      <button class="mini" data-act="imgclr" ${a}>убрать</button>` : ''}
    </div></div></div>`;
}

function fieldHTML(f, val, p) {
  if (f.t === 'hint') return `<p class="hint">${esc(f.l)}</p>`;
  if (f.t === 'image') return imageHTML(f, val, p);
  const a = attrs(p);
  if (f.t === 'textarea') return `<label>${esc(f.l)}<textarea ${a} data-f rows="${f.rows || 3}">${esc(val)}</textarea></label>`;
  return `<label>${esc(f.l)}<input ${a} data-f value="${esc(val)}"></label>`;
}

function listHTML(b, f) {
  const items = b.data[f.k] || [];
  const base = `data-bid="${b.id}" data-k="${f.k}"`;
  return `<div class="list"><div class="lh">${esc(f.l)}</div>
${items.map((it, i) => `<div class="litem"><div class="lihead"><b>${esc(f.label(it, i))}</b><span>
  <button data-act="litem-up" ${base} data-i="${i}" title="выше">↑</button><button data-act="litem-down" ${base} data-i="${i}" title="ниже">↓</button><button data-act="litem-del" ${base} data-i="${i}" title="удалить">✕</button>
</span></div>${f.sub.map(sf => fieldHTML(sf, it[sf.k], { bid: b.id, k: f.k, i, sk: sf.k })).join('')}</div>`).join('\n')}
<button class="mini add" data-act="litem-add" ${base}>${esc(f.add)}</button></div>`;
}

function blockCard(b) {
  const def = BLOCKS[b.type];
  const open = state.selected === b.id;
  const sub = String(b.data.title || b.data.text || '').slice(0, 26);
  const body = open
    ? `<div class="bbody">${def.fields.map(f => f.t === 'list' ? listHTML(b, f) : fieldHTML(f, b.data[f.k], { bid: b.id, k: f.k })).join('')}</div>`
    : '';
  return `<div class="bcard${open ? ' open' : ''}" data-id="${b.id}">
  <div class="bhead" data-act="sel"><span class="grip" title="перетащить">⋮⋮</span><span class="bname">${def.icon} ${def.name}</span><span class="bsub">${esc(sub)}</span>
    <span class="bbtns"><button data-act="up" title="выше">↑</button><button data-act="down" title="ниже">↓</button><button data-act="dup" title="дублировать">⧉</button><button data-act="del" title="удалить">✕</button></span></div>${body}
</div>`;
}

function renderBlocksTab() {
  $('#tabBlocks').innerHTML = `<div class="blist">${state.blocks.map(blockCard).join('')}</div>
<button class="addbtn" data-act="toggle-add">${paletteOpen ? '− скрыть список блоков' : '+ добавить блок'}</button>
<div class="palette"${paletteOpen ? '' : ' hidden'}>${Object.entries(BLOCKS).map(([k, d]) => `<button data-add="${k}"><span>${d.icon}</span>${d.name}</button>`).join('')}</div>`;
}

/* ---------- панель: сайт ---------- */

function renderSiteTab() {
  const s = state.site;
  const t = THEMES[s.theme] || THEMES.sky;
  const inp = (k, l, ph) => `<label>${l}<input data-s="${k}" value="${esc(s[k])}"${ph ? ` placeholder="${ph}"` : ''}></label>`;
  $('#tabSite').innerHTML = `
<h3>название</h3>
${inp('name', 'название сайта (шапка и подвал)')}
<h3>тема</h3>
<div class="themes">${Object.entries(THEMES).map(([k, th]) => `<button class="theme${s.theme === k ? ' on' : ''}" data-theme="${k}" style="--c:${th.accent};--b:${th.bg};color:${th.fg}"><i></i>${th.name}</button>`).join('')}</div>
<label>акцентный цвет<input type="color" data-s="accent" value="${esc(s.accent || t.accent)}"></label>
<button class="mini" data-act="accent-reset" style="margin-top:6px">как в теме</button>
<h3>контакты</h3>
${inp('phone', 'телефон', '+7 777 123 45 67')}
${inp('whatsapp', 'whatsapp (номер)', '77771234567')}
${inp('telegram', 'telegram (ник)', 'my_business')}
${inp('instagram', 'instagram (ник)', 'my_business')}
${inp('address', 'адрес')}
${inp('hours', 'часы работы')}
${inp('map', 'ссылка на карту (2гис / google)')}
<h3>прочее</h3>
<label class="check"><input type="checkbox" data-s="floatWa"${s.floatWa ? ' checked' : ''}> кнопка whatsapp в углу</label>
<label class="check"><input type="checkbox" data-s="showSign"${s.showSign ? ' checked' : ''}> подпись «Создано @bauyrzhanov_12_» в подвале</label>`;
}

function setTab(name) {
  document.querySelectorAll('.tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === name));
  $('#tabBlocks').hidden = name !== 'blocks';
  $('#tabSite').hidden = name !== 'site';
  if (name === 'site') renderSiteTab();
}

/* ---------- действия ---------- */

function commit(rebuild) {
  save();
  if (rebuild) renderBlocksTab();
  renderPreview();
}

function setValue(ds, v) {
  const b = findBlock(ds.bid);
  if (!b) return;
  if (ds.i !== undefined) b.data[ds.k][+ds.i][ds.sk] = v;
  else b.data[ds.k] = v;
}

function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(toast.t);
  toast.t = setTimeout(() => { t.hidden = true; }, 3500);
}

function addBlock(type) {
  const b = { id: uid(), type, data: BLOCKS[type].defaults() };
  state.blocks.push(b);
  state.selected = b.id;
  paletteOpen = false;
  scrollToSel = true;
  save();
  renderBlocksTab();
  renderPreview(true);
  const open = $('.bcard.open');
  if (open) open.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

function moveBlock(id, delta) {
  const i = state.blocks.findIndex(b => b.id === id);
  const j = i + delta;
  if (i < 0 || j < 0 || j >= state.blocks.length) return;
  [state.blocks[i], state.blocks[j]] = [state.blocks[j], state.blocks[i]];
  commit(true);
}

function resizeImage(file, max, quality) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onerror = reject;
    r.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const k = Math.min(1, max / Math.max(img.width, img.height));
        const w = Math.round(img.width * k), h = Math.round(img.height * k);
        const cv = document.createElement('canvas');
        cv.width = w; cv.height = h;
        const ctx = cv.getContext('2d');
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        resolve(cv.toDataURL('image/jpeg', quality));
      };
      img.src = r.result;
    };
    r.readAsDataURL(file);
  });
}

const panel = $('#panel');

panel.addEventListener('input', e => {
  const el = e.target;
  if (el.dataset.f !== undefined) {
    setValue(el.dataset, el.value);
    if (el.dataset.k === 'title' && el.dataset.i === undefined) {
      const sub = el.closest('.bcard') && el.closest('.bcard').querySelector('.bsub');
      if (sub) sub.textContent = el.value.slice(0, 26);
    }
    commit(false);
  } else if (el.dataset.s) {
    state.site[el.dataset.s] = el.type === 'checkbox' ? el.checked : el.value;
    commit(false);
  }
});

panel.addEventListener('change', async e => {
  const el = e.target;
  if (el.dataset.up === undefined || !el.files || !el.files[0]) return;
  try {
    const url = await resizeImage(el.files[0], 1400, 0.78);
    setValue(el.dataset, url);
    commit(true);
  } catch (err) {
    toast('не удалось прочитать картинку');
  }
  el.value = '';
});

panel.addEventListener('click', e => {
  const t = e.target;
  const tab = t.closest('[data-tab]');
  if (tab) return setTab(tab.dataset.tab);
  const add = t.closest('[data-add]');
  if (add) return addBlock(add.dataset.add);
  const th = t.closest('[data-theme]');
  if (th) {
    state.site.theme = th.dataset.theme;
    state.site.accent = '';
    renderSiteTab();
    return commit(false);
  }
  const a = t.closest('[data-act]');
  if (!a) return;
  const card = a.closest('.bcard');
  const id = card && card.dataset.id;
  const ds = a.dataset;

  switch (ds.act) {
    case 'toggle-add':
      paletteOpen = !paletteOpen;
      return renderBlocksTab();
    case 'sel':
      state.selected = state.selected === id ? null : id;
      renderBlocksTab();
      return highlight(state.selected, true);
    case 'up': return moveBlock(id, -1);
    case 'down': return moveBlock(id, 1);
    case 'dup': {
      const i = state.blocks.findIndex(b => b.id === id);
      const copy = { id: uid(), type: state.blocks[i].type, data: clone(state.blocks[i].data) };
      state.blocks.splice(i + 1, 0, copy);
      state.selected = copy.id;
      scrollToSel = true;
      save();
      renderBlocksTab();
      return renderPreview(true);
    }
    case 'del':
      if (!confirm('удалить блок?')) return;
      state.blocks = state.blocks.filter(b => b.id !== id);
      if (state.selected === id) state.selected = null;
      return commit(true);
    case 'imgurl': {
      const u = prompt('ссылка на картинку (https://...)');
      if (u && u.trim()) { setValue(ds, u.trim()); commit(true); }
      return;
    }
    case 'imgclr':
      setValue(ds, '');
      return commit(true);
    case 'accent-reset':
      state.site.accent = '';
      renderSiteTab();
      return commit(false);
    case 'litem-add': case 'litem-up': case 'litem-down': case 'litem-del': {
      const b = findBlock(ds.bid);
      const arr = b.data[ds.k];
      const i = +ds.i;
      if (ds.act === 'litem-add') {
        const f = BLOCKS[b.type].fields.find(x => x.k === ds.k);
        const o = {};
        f.sub.forEach(sf => { o[sf.k] = ''; });
        arr.push(o);
      } else if (ds.act === 'litem-up') {
        if (i > 0) [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]];
      } else if (ds.act === 'litem-down') {
        if (i < arr.length - 1) [arr[i + 1], arr[i]] = [arr[i], arr[i + 1]];
      } else {
        arr.splice(i, 1);
      }
      return commit(true);
    }
  }
});

/* перетаскивание карточек за «⋮⋮» */

let dragId = null;
const clearMarks = () => document.querySelectorAll('.over-top,.over-bottom,.drag').forEach(x => x.classList.remove('over-top', 'over-bottom', 'drag'));

panel.addEventListener('mousedown', e => {
  const g = e.target.closest('.grip');
  if (g) g.closest('.bcard').draggable = true;
});
panel.addEventListener('dragstart', e => {
  const c = e.target.classList && e.target.classList.contains('bcard') ? e.target : null;
  if (!c) return;
  dragId = c.dataset.id;
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', dragId);
  c.classList.add('drag');
});
panel.addEventListener('dragover', e => {
  if (!dragId) return;
  const c = e.target.closest('.bcard');
  if (!c || c.dataset.id === dragId) return;
  e.preventDefault();
  const r = c.getBoundingClientRect();
  const after = e.clientY > r.top + r.height / 2;
  document.querySelectorAll('.over-top,.over-bottom').forEach(x => x.classList.remove('over-top', 'over-bottom'));
  c.classList.add(after ? 'over-bottom' : 'over-top');
});
panel.addEventListener('drop', e => {
  if (!dragId) return;
  const c = e.target.closest('.bcard');
  if (!c || c.dataset.id === dragId) return;
  e.preventDefault();
  const r = c.getBoundingClientRect();
  const after = e.clientY > r.top + r.height / 2;
  const from = state.blocks.findIndex(b => b.id === dragId);
  const [it] = state.blocks.splice(from, 1);
  const to = state.blocks.findIndex(b => b.id === c.dataset.id);
  state.blocks.splice(after ? to + 1 : to, 0, it);
  dragId = null;
  commit(true);
});
panel.addEventListener('dragend', () => {
  document.querySelectorAll('.bcard[draggable="true"]').forEach(x => { x.draggable = false; });
  dragId = null;
  clearMarks();
});
document.addEventListener('mouseup', () => {
  if (!dragId) document.querySelectorAll('.bcard[draggable="true"]').forEach(x => { x.draggable = false; });
});

/* ---------- верхняя панель ---------- */

document.querySelectorAll('.bar button').forEach(b => {
  b.onclick = () => {
    document.querySelectorAll('.bar button').forEach(x => x.classList.remove('on'));
    b.classList.add('on');
    frame.style.width = b.dataset.w;
  };
});

function download(blob, name) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

const slug = s => String(s || '').toLowerCase().replace(/[^a-z0-9а-яё]+/gi, '-').replace(/^-+|-+$/g, '') || 'site';

$('#btnZip').onclick = async () => {
  if (typeof JSZip === 'undefined') return toast('не загрузилась библиотека zip, проверь интернет и обнови страницу');
  let html = buildSite(state, false);
  const zip = new JSZip();
  const files = new Map();
  let n = 0;
  html = html.replace(/data:image\/(jpeg|png|webp|gif);base64,[A-Za-z0-9+/=]+/g, m => {
    if (!files.has(m)) {
      const ext = m.slice(11, m.indexOf(';')).replace('jpeg', 'jpg');
      const name = 'img/photo' + (++n) + '.' + ext;
      files.set(m, name);
      zip.file(name, m.split(',')[1], { base64: true });
    }
    return files.get(m);
  });
  zip.file('index.html', html);
  zip.file('.nojekyll', '');
  zip.file('README.txt', 'залей эти файлы в корень репозитория, затем settings → pages → deploy from a branch → main / root.\n');
  download(await zip.generateAsync({ type: 'blob' }), slug(state.site.name) + '.zip');
  toast('готово: распакуй архив и залей в репозиторий');
};

$('#btnExport').onclick = () =>
  download(new Blob([JSON.stringify({ site: state.site, blocks: state.blocks }, null, 2)], { type: 'application/json' }), 'blokka-project.json');

$('#fileImport').onchange = e => {
  const f = e.target.files[0];
  if (!f) return;
  const r = new FileReader();
  r.onload = () => {
    try {
      const data = normalize(JSON.parse(r.result));
      if (!data) throw new Error('bad');
      state = data;
      save();
      renderBlocksTab();
      renderSiteTab();
      renderPreview(true);
      toast('проект загружен');
    } catch (err) { toast('не удалось прочитать файл проекта'); }
  };
  r.readAsText(f);
  e.target.value = '';
};

/* шаблоны */

const dlg = $('#dlg');
$('#btnPresets').onclick = () => {
  dlg.innerHTML = `<div class="dhead"><b>готовые шаблоны</b><button data-close>✕</button></div>
<p class="hint">шаблон заменит блоки и тему. контакты и подпись сохранятся.</p>
<div class="pgrid">${Object.entries(PRESETS).map(([k, p]) => `<button class="pcard" data-preset="${k}"><b>${p.title}</b><span>${p.sub}</span><i>${p.blocks.length} блоков</i></button>`).join('')}</div>`;
  dlg.showModal();
};
dlg.addEventListener('click', e => {
  if (e.target === dlg || e.target.closest('[data-close]')) return dlg.close();
  const p = e.target.closest('[data-preset]');
  if (!p) return;
  if (!confirm('заменить текущие блоки шаблоном?')) return;
  const s = state.site;
  const keep = { phone: s.phone, whatsapp: s.whatsapp, telegram: s.telegram, instagram: s.instagram, address: s.address, map: s.map, showSign: s.showSign, floatWa: s.floatWa };
  state = fromPreset(p.dataset.preset, keep);
  save();
  renderBlocksTab();
  renderSiteTab();
  renderPreview(true);
  dlg.close();
});

/* старт */

renderBlocksTab();
renderPreview(true);
