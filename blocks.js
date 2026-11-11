/* blokka: каталог блоков, варианты, стили и генерация сайта.
   файл не трогает dom, поэтому его можно запускать и в браузере, и в node. */
'use strict';

const esc = s => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const uid = () => 'b' + Math.random().toString(36).slice(2, 8);
const digits = s => String(s || '').replace(/\D/g, '');
const nick = s => String(s || '').trim().replace(/^https?:\/\/(t\.me|instagram\.com)\//, '').replace(/^@/, '').replace(/\/+$/, '');
const cssUrl = u => esc(String(u).replace(/'/g, '%27').replace(/"/g, '%22').replace(/\(/g, '%28').replace(/\)/g, '%29'));
const clone = o => JSON.parse(JSON.stringify(o));
const ext = href => /^https?:/.test(href) ? ' target="_blank" rel="noopener"' : '';
const lines = s => String(s || '').split('\n').map(x => x.trim()).filter(Boolean);
const safeColor = (v, fallback) => /^#[0-9a-f]{3,8}$/i.test(String(v || '')) ? v : fallback;

/* ---------- темы и шрифты ---------- */

const THEMES = {
  sky:   { name: 'небо',   bg: '#f5f9fc', fg: '#12263a', card: '#ffffff', muted: '#5d7185', accent: '#1a8fd1', radius: 16 },
  sun:   { name: 'солнце', bg: '#fffaf0', fg: '#2a2217', card: '#ffffff', muted: '#7a6a52', accent: '#f08a24', radius: 20 },
  neon:  { name: 'неон',   bg: '#0d0d14', fg: '#f1f1f7', card: '#171724', muted: '#9a9ab3', accent: '#8b5cf6', radius: 14 },
  brick: { name: 'кирпич', bg: '#fff6ee', fg: '#2b1d14', card: '#ffffff', muted: '#85685a', accent: '#d9602b', radius: 22 }
};

const FONTS = {
  system:     { name: 'системный',        css: 'system-ui,-apple-system,"Segoe UI",Roboto,sans-serif', g: '' },
  inter:      { name: 'Inter',            css: '"Inter",system-ui,sans-serif', g: 'Inter:wght@400;500;600;700;800' },
  manrope:    { name: 'Manrope',          css: '"Manrope",system-ui,sans-serif', g: 'Manrope:wght@400;500;600;700;800' },
  montserrat: { name: 'Montserrat',       css: '"Montserrat",system-ui,sans-serif', g: 'Montserrat:wght@400;500;600;700;800' },
  nunito:     { name: 'Nunito',           css: '"Nunito",system-ui,sans-serif', g: 'Nunito:wght@400;600;700;800' },
  unbounded:  { name: 'Unbounded',        css: '"Unbounded",system-ui,sans-serif', g: 'Unbounded:wght@400;500;600;700' },
  playfair:   { name: 'Playfair Display', css: '"Playfair Display",Georgia,serif', g: 'Playfair+Display:wght@400;600;700;800' },
  merriweather: { name: 'Merriweather',   css: '"Merriweather",Georgia,serif', g: 'Merriweather:wght@400;700' },
  robotoslab: { name: 'Roboto Slab',      css: '"Roboto Slab",Georgia,serif', g: 'Roboto+Slab:wght@400;600;700' }
};

/* ---------- каталог блоков ---------- */

const CATS = [['hero', 'обложка'], ['about', 'о нас и текст'], ['offer', 'услуги и цены'], ['trust', 'доверие'], ['contact', 'связь']];

const T = (k, l) => ({ k, l, t: 'text' });
const A = (k, l, rows) => ({ k, l, t: 'textarea', rows: rows || 3 });
const I = (k, l) => ({ k, l, t: 'image' });
const C = (k, l) => ({ k, l, t: 'check' });
const L = (k, l, add, label, sub) => ({ k, l, t: 'list', add, label, sub });
const TITLE = T('title', 'заголовок');

const BLOCKS = {
  hero: {
    name: 'обложка', icon: '🖼️', cat: 'hero', menu: null, variants: ['слева', 'по центру', 'с фото справа'],
    defaults: () => ({ title: 'название бизнеса', sub: 'коротко о том, чем вы полезны клиентам', cta: 'связаться', image: '' }),
    fields: [TITLE, A('sub', 'подзаголовок'), T('cta', 'текст кнопки'), I('image', 'фото (фон или справа)')]
  },
  about: {
    name: 'о нас', icon: '💬', cat: 'about', menu: 'о нас', variants: ['текст и фото', 'по центру'],
    defaults: () => ({ title: 'о нас', text: 'расскажите о себе: чем занимаетесь, чем отличаетесь, почему вам доверяют.', image: '' }),
    fields: [TITLE, A('text', 'текст', 5), I('image', 'фото')]
  },
  text: {
    name: 'текст', icon: '📝', cat: 'about', menu: null, variants: ['обычный'],
    defaults: () => ({ title: 'заголовок', text: 'любой текст: условия, правила, история компании.' }),
    fields: [TITLE, A('text', 'текст', 6)]
  },
  features: {
    name: 'преимущества', icon: '⚡', cat: 'offer', menu: null, variants: ['карточки', 'без рамок'],
    defaults: () => ({ title: 'почему выбирают нас', items: [
      { icon: '⚡', title: 'быстро', text: 'делаем в срок и без лишней бюрократии.' },
      { icon: '💎', title: 'качественно', text: 'работаем по стандартам и отвечаем за результат.' },
      { icon: '🤝', title: 'честно', text: 'прозрачные цены без скрытых доплат.' }
    ] }),
    fields: [TITLE, L('items', 'преимущества', '+ преимущество', i => i.title || 'преимущество',
      [T('icon', 'иконка (эмодзи)'), T('title', 'название'), A('text', 'описание', 2)])]
  },
  services: {
    name: 'услуги и цены', icon: '💰', cat: 'offer', menu: 'услуги', variants: ['карточки', 'список'],
    defaults: () => ({ title: 'услуги и цены', items: [
      { title: 'услуга 1', price: '5 000 ₸', desc: '' },
      { title: 'услуга 2', price: '10 000 ₸', desc: '' },
      { title: 'услуга 3', price: '15 000 ₸', desc: '' }
    ] }),
    fields: [TITLE, L('items', 'услуги', '+ услуга', i => i.title || 'услуга',
      [T('title', 'название'), T('price', 'цена'), A('desc', 'описание', 2)])]
  },
  pricing: {
    name: 'тарифы', icon: '🏷️', cat: 'offer', menu: 'тарифы', variants: ['карточки'],
    defaults: () => ({ title: 'тарифы', button: 'выбрать', items: [
      { name: 'базовый', price: '10 000 ₸', text: 'пункт 1\nпункт 2\nпункт 3', badge: '' },
      { name: 'стандарт', price: '20 000 ₸', text: 'всё из базового\nпункт 4\nпункт 5', badge: 'выбор клиентов' },
      { name: 'премиум', price: '35 000 ₸', text: 'всё из стандарта\nпункт 6\nпункт 7', badge: '' }
    ] }),
    fields: [TITLE, T('button', 'текст кнопки'), L('items', 'тарифы', '+ тариф', i => i.name || 'тариф',
      [T('name', 'название'), T('price', 'цена'), A('text', 'что входит (по пункту на строку)', 4), T('badge', 'метка (необязательно)')])]
  },
  steps: {
    name: 'этапы работы', icon: '🪜', cat: 'offer', menu: null, variants: ['карточки'],
    defaults: () => ({ title: 'как мы работаем', items: [
      { title: 'заявка', text: 'вы оставляете заявку или пишете нам в мессенджер.' },
      { title: 'обсуждение', text: 'уточняем задачу и согласуем стоимость.' },
      { title: 'результат', text: 'выполняем работу и передаём вам итог.' }
    ] }),
    fields: [TITLE, L('items', 'этапы', '+ этап', i => i.title || 'этап', [T('title', 'название'), A('text', 'описание', 2)])]
  },
  numbers: {
    name: 'цифры', icon: '🔢', cat: 'trust', menu: null, variants: ['в ряд'],
    defaults: () => ({ title: '', items: [
      { num: '10+', label: 'лет опыта' }, { num: '5 000', label: 'клиентов' }, { num: '4.9', label: 'средняя оценка' }
    ] }),
    fields: [TITLE, L('items', 'цифры', '+ цифра', i => i.num || 'цифра', [T('num', 'число'), T('label', 'подпись')])]
  },
  team: {
    name: 'команда', icon: '👥', cat: 'trust', menu: 'команда', variants: ['круглые фото'],
    defaults: () => ({ title: 'команда', items: [
      { name: 'имя фамилия', role: 'должность', image: '' }, { name: 'имя фамилия', role: 'должность', image: '' }, { name: 'имя фамилия', role: 'должность', image: '' }
    ] }),
    fields: [TITLE, L('items', 'сотрудники', '+ сотрудник', i => i.name || 'сотрудник', [T('name', 'имя'), T('role', 'должность'), I('image', 'фото')])]
  },
  gallery: {
    name: 'галерея', icon: '📷', cat: 'trust', menu: 'галерея', variants: ['сетка', 'крупно'],
    defaults: () => ({ title: 'галерея', items: [{ image: '' }, { image: '' }, { image: '' }] }),
    fields: [TITLE, L('items', 'фото', '+ фото', (i, n) => 'фото ' + (n + 1), [I('image', 'фото')])]
  },
  reviews: {
    name: 'отзывы', icon: '⭐', cat: 'trust', menu: 'отзывы', variants: ['карточки', 'цитаты'],
    defaults: () => ({ title: 'отзывы', items: [
      { name: 'имя клиента', text: 'здесь будет отзыв клиента о вашей работе.' },
      { name: 'имя клиента', text: 'ещё один отзыв, лучше с конкретным результатом.' }
    ] }),
    fields: [TITLE, L('items', 'отзывы', '+ отзыв', i => i.name || 'отзыв', [T('name', 'имя'), A('text', 'отзыв')])]
  },
  faq: {
    name: 'вопросы и ответы', icon: '❓', cat: 'trust', menu: 'вопросы', variants: ['список'],
    defaults: () => ({ title: 'частые вопросы', items: [
      { q: 'как записаться?', a: 'напишите нам в whatsapp или позвоните.' },
      { q: 'где вы находитесь?', a: 'адрес указан в разделе «контакты».' }
    ] }),
    fields: [TITLE, L('items', 'вопросы', '+ вопрос', i => i.q || 'вопрос', [T('q', 'вопрос'), A('a', 'ответ')])]
  },
  form: {
    name: 'форма заявки', icon: '✉️', cat: 'contact', menu: null, variants: ['карточка', 'баннер'],
    defaults: () => ({ title: 'оставьте заявку', text: 'перезвоним в течение 15 минут.', button: 'отправить', askName: true, askPhone: true, askMsg: false }),
    fields: [TITLE, A('text', 'текст', 2), T('button', 'текст кнопки'),
      C('askName', 'спрашивать имя'), C('askPhone', 'спрашивать телефон'), C('askMsg', 'поле для комментария'),
      { k: '_h', t: 'hint', l: 'заявка откроет whatsapp с готовым сообщением. номер указывается на вкладке «сайт».' }]
  },
  cta: {
    name: 'призыв к действию', icon: '📣', cat: 'contact', menu: null, variants: ['баннер', 'простой'],
    defaults: () => ({ title: 'готовы начать?', text: 'напишите нам, и мы всё расскажем.', button: 'написать нам' }),
    fields: [TITLE, A('text', 'текст', 2), T('button', 'текст кнопки')]
  },
  contacts: {
    name: 'контакты', icon: '📍', cat: 'contact', menu: 'контакты', variants: ['карточка', 'кнопки'],
    defaults: () => ({ title: 'контакты', note: '' }),
    fields: [TITLE, A('note', 'заметка (необязательно)', 2),
      { k: '_h', t: 'hint', l: 'телефон, адрес и мессенджеры заполняются на вкладке «сайт».' }]
  },
  map: {
    name: 'карта', icon: '🗺️', cat: 'contact', menu: null, variants: ['на всю ширину'],
    defaults: () => ({ title: 'как нас найти', embed: '', note: '' }),
    fields: [TITLE, T('embed', 'ссылка для встраивания (необязательно)'), A('note', 'подпись', 2),
      { k: '_h', t: 'hint', l: 'если оставить пустым, карта строится по адресу с вкладки «сайт». свою карту вставь ссылкой из «поделиться → встроить».' }]
  },
  video: {
    name: 'видео', icon: '▶️', cat: 'contact', menu: null, variants: ['на всю ширину'],
    defaults: () => ({ title: 'видео', url: '' }),
    fields: [TITLE, T('url', 'ссылка на youtube или vimeo')]
  }
};

const defaultSet = () => ({ bg: '', pad: 'm', align: 'left', hide: false });

const defaultSite = () => ({
  name: 'мой сайт', theme: 'sky', accent: '', bg: '', fg: '',
  fontHead: 'system', fontBody: 'system', btnShape: 'round', btnLook: 'fill',
  phone: '', whatsapp: '', telegram: '', instagram: '', address: '', hours: '', map: '',
  navBtn: '', anim: true, showSign: true, floatWa: true,
  seoTitle: '', seoDesc: '', ogImage: '', favicon: ''
});

/* ---------- отрисовка блоков ---------- */

const TOOLBAR = '<div class="tb" contenteditable="false"><button data-a="up" title="выше">↑</button><button data-a="down" title="ниже">↓</button><button data-a="dup" title="дублировать">⧉</button><button data-a="del" title="удалить">✕</button></div>';

const pa = (b, k, o) => ` data-bid="${b.id}" data-k="${k}"${o && o.i != null ? ` data-i="${o.i}" data-sk="${o.sk}"` : ''}`;
const ed = (b, c, k, o) => c.pv ? ` contenteditable="true" spellcheck="false" data-e${o && o.ml ? ' data-ml' : ''}${pa(b, k, o)}` : '';
const im = (b, c, k, o) => c.pv ? ` data-img${pa(b, k, o)}` : '';

function ctaHref(st) {
  const s = st.site;
  if (digits(s.whatsapp)) return 'https://wa.me/' + digits(s.whatsapp);
  if (nick(s.telegram)) return 'https://t.me/' + nick(s.telegram);
  if (digits(s.phone)) return 'tel:' + String(s.phone).replace(/[^\d+]/g, '');
  const f = st.blocks.find(b => b.type === 'form' || b.type === 'contacts');
  return f ? '#' + f.id : '#';
}

function wrap(b, c, o, inner) {
  const set = Object.assign(defaultSet(), b.set || {});
  if (set.hide && !c.pv) return '';
  const cls = ['bk', 't-' + b.type, 'v' + (b.variant || 1), 'pad-' + set.pad, set.align === 'center' ? 'al-c' : '',
    set.bg ? 'bg-' + set.bg : '', set.hide ? 'is-hidden' : '', o.cls || ''].filter(Boolean).join(' ');
  const tag = o.tag || 'section';
  return `<${tag} id="${b.id}" class="${cls}"${o.style ? ` style="${o.style}"` : ''}${c.pv ? ` data-bid="${b.id}"` : ''}>${c.pv ? TOOLBAR : ''}${inner}</${tag}>`;
}

const h2 = (b, c) => (b.data.title || c.pv) ? `<h2${ed(b, c, 'title')}>${esc(b.data.title)}</h2>` : '';

function videoSrc(u) {
  u = String(u || '').trim();
  let m = u.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/))([\w-]{11})/);
  if (m) return 'https://www.youtube.com/embed/' + m[1];
  m = u.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return m ? 'https://player.vimeo.com/video/' + m[1] : '';
}

function mapSrc(embed, address) {
  const m = String(embed || '').match(/src=["']([^"']+)["']/);
  const u = (m ? m[1] : String(embed || '').trim());
  if (/^https:\/\//.test(u)) return u;
  return address ? 'https://maps.google.com/maps?q=' + encodeURIComponent(address) + '&output=embed' : '';
}

const RENDER = {
  hero(b, s, c) {
    const d = b.data, v = b.variant || 1;
    const dark = (THEMES[s.theme] || THEMES.sky).bg === '#0d0d14';
    const ov = dark ? 'rgba(10,10,18,.72),rgba(10,10,18,.88)' : 'rgba(255,255,255,.72),rgba(255,255,255,.9)';
    const style = d.image && v !== 3 ? `background-image:linear-gradient(${ov}),url('${cssUrl(d.image)}')` : '';
    const btn = d.cta ? `<a class="btn" href="${esc(c.cta)}"${ext(c.cta)}${ed(b, c, 'cta')}>${esc(d.cta)}</a>` : '';
    const text = `<h1${ed(b, c, 'title')}>${esc(d.title)}</h1>${d.sub || c.pv ? `<p${ed(b, c, 'sub', { ml: 1 })}>${esc(d.sub)}</p>` : ''}${btn}`;
    let inner;
    if (v === 3) {
      const pic = d.image ? `<img src="${esc(d.image)}" alt=""${im(b, c, 'image')}>` : (c.ph ? `<div class="ph"${im(b, c, 'image')}>+ фото</div>` : '');
      inner = `<div class="wrap split"><div class="txt">${text}</div>${pic ? `<div class="pic">${pic}</div>` : ''}</div>`;
    } else {
      inner = `<div class="wrap">${text}</div>`;
    }
    return wrap(b, c, { tag: 'header', style: style, cls: d.image && v !== 3 ? 'has-img' : '' }, inner);
  },

  about(b, s, c) {
    const d = b.data;
    const pic = d.image ? `<img class="pic" src="${esc(d.image)}" alt=""${im(b, c, 'image')}>` : (c.ph ? `<div class="ph pic"${im(b, c, 'image')}>+ фото</div>` : '');
    return wrap(b, c, {}, `<div class="wrap"><div class="ab${d.image ? ' two' : ''}"><div>${h2(b, c)}<p${ed(b, c, 'text', { ml: 1 })}>${esc(d.text)}</p></div>${pic}</div></div>`);
  },

  text(b, s, c) {
    const d = b.data;
    return wrap(b, c, {}, `<div class="wrap">${h2(b, c)}<p class="tx"${ed(b, c, 'text', { ml: 1 })}>${esc(d.text)}</p></div>`);
  },

  features(b, s, c) {
    const ei = (i, sk, ml) => ed(b, c, 'items', { i, sk, ml });
    const items = (b.data.items || []).map((it, i) => ({ it, i })).filter(x => x.it.title || x.it.icon || c.pv);
    return wrap(b, c, {}, `<div class="wrap">${h2(b, c)}<div class="grid">
${items.map(({ it, i }) => `  <div class="card"><div class="ic"${ei(i, 'icon')}>${esc(it.icon)}</div><h4${ei(i, 'title')}>${esc(it.title)}</h4>${it.text || c.pv ? `<p${ei(i, 'text', 1)}>${esc(it.text)}</p>` : ''}</div>`).join('\n')}
</div></div>`);
  },

  services(b, s, c) {
    const v = b.variant || 1;
    const ei = (i, sk, ml) => ed(b, c, 'items', { i, sk, ml });
    const items = (b.data.items || []).map((it, i) => ({ it, i })).filter(x => x.it.title || x.it.price || c.pv);
    const cell = ({ it, i }) => v === 2
      ? `  <div class="row"><div><b${ei(i, 'title')}>${esc(it.title)}</b>${it.desc || c.pv ? `<p${ei(i, 'desc', 1)}>${esc(it.desc)}</p>` : ''}</div><span class="price"${ei(i, 'price')}>${esc(it.price)}</span></div>`
      : `  <div class="card"><h4${ei(i, 'title')}>${esc(it.title)}</h4>${it.price || c.pv ? `<div class="price"${ei(i, 'price')}>${esc(it.price)}</div>` : ''}${it.desc || c.pv ? `<p${ei(i, 'desc', 1)}>${esc(it.desc)}</p>` : ''}</div>`;
    return wrap(b, c, {}, `<div class="wrap">${h2(b, c)}<div class="${v === 2 ? 'rows' : 'grid'}">
${items.map(cell).join('\n')}
</div></div>`);
  },

  pricing(b, s, c) {
    const d = b.data;
    const ei = (i, sk) => ed(b, c, 'items', { i, sk });
    const items = (d.items || []).map((it, i) => ({ it, i })).filter(x => x.it.name || x.it.price || c.pv);
    return wrap(b, c, {}, `<div class="wrap">${h2(b, c)}<div class="plans">
${items.map(({ it, i }) => `  <div class="card plan${it.badge ? ' hot' : ''}">${it.badge ? `<span class="badge"${ei(i, 'badge')}>${esc(it.badge)}</span>` : ''}<div class="pn"${ei(i, 'name')}>${esc(it.name)}</div><div class="pp"${ei(i, 'price')}>${esc(it.price)}</div><ul>${lines(it.text).map(x => `<li>${esc(x)}</li>`).join('')}</ul>${d.button ? `<a class="btn" href="${esc(c.cta)}"${ext(c.cta)}${ed(b, c, 'button')}>${esc(d.button)}</a>` : ''}</div>`).join('\n')}
</div></div>`);
  },

  steps(b, s, c) {
    const ei = (i, sk, ml) => ed(b, c, 'items', { i, sk, ml });
    const items = (b.data.items || []).map((it, i) => ({ it, i })).filter(x => x.it.title || c.pv);
    return wrap(b, c, {}, `<div class="wrap">${h2(b, c)}<div class="steps">
${items.map(({ it, i }) => `  <div class="card step"><h4${ei(i, 'title')}>${esc(it.title)}</h4>${it.text || c.pv ? `<p${ei(i, 'text', 1)}>${esc(it.text)}</p>` : ''}</div>`).join('\n')}
</div></div>`);
  },

  numbers(b, s, c) {
    const ei = (i, sk) => ed(b, c, 'items', { i, sk });
    const items = (b.data.items || []).map((it, i) => ({ it, i })).filter(x => x.it.num || c.pv);
    return wrap(b, c, {}, `<div class="wrap">${h2(b, c)}<div class="nums">
${items.map(({ it, i }) => `  <div><div class="num"${ei(i, 'num')}>${esc(it.num)}</div><div class="nl"${ei(i, 'label')}>${esc(it.label)}</div></div>`).join('\n')}
</div></div>`);
  },

  team(b, s, c) {
    const ei = (i, sk) => ed(b, c, 'items', { i, sk });
    const items = (b.data.items || []).map((it, i) => ({ it, i })).filter(x => x.it.name || c.pv);
    return wrap(b, c, {}, `<div class="wrap">${h2(b, c)}<div class="team">
${items.map(({ it, i }) => {
      const av = it.image
        ? `<img class="av" src="${esc(it.image)}" alt=""${im(b, c, 'items', { i, sk: 'image' })}>`
        : `<div class="av"${im(b, c, 'items', { i, sk: 'image' })}>${esc((it.name || '?').trim().charAt(0).toUpperCase())}</div>`;
      return `  <div>${av}<b${ei(i, 'name')}>${esc(it.name)}</b><span${ei(i, 'role')}>${esc(it.role)}</span></div>`;
    }).join('\n')}
</div></div>`);
  },

  gallery(b, s, c) {
    const items = (b.data.items || []).map((it, i) => ({ it, i })).filter(x => x.it.image || c.ph);
    if (!items.length) return '';
    return wrap(b, c, {}, `<div class="wrap">${h2(b, c)}<div class="gal">
${items.map(({ it, i }) => it.image
      ? `  <img src="${esc(it.image)}" alt="" loading="lazy"${im(b, c, 'items', { i, sk: 'image' })}>`
      : `  <div class="ph"${im(b, c, 'items', { i, sk: 'image' })}>+ фото</div>`).join('\n')}
</div></div>`);
  },

  reviews(b, s, c) {
    const ei = (i, sk, ml) => ed(b, c, 'items', { i, sk, ml });
    const items = (b.data.items || []).map((it, i) => ({ it, i })).filter(x => x.it.text || c.pv);
    return wrap(b, c, {}, `<div class="wrap">${h2(b, c)}<div class="grid">
${items.map(({ it, i }) => `  <div class="card rev"><q${ei(i, 'text', 1)}>${esc(it.text)}</q>${it.name || c.pv ? `<small${ei(i, 'name')}>${esc(it.name)}</small>` : ''}</div>`).join('\n')}
</div></div>`);
  },

  faq(b, s, c) {
    const ei = (i, sk, ml) => ed(b, c, 'items', { i, sk, ml });
    const items = (b.data.items || []).map((it, i) => ({ it, i })).filter(x => x.it.q || c.pv);
    return wrap(b, c, {}, `<div class="wrap">${h2(b, c)}
${items.map(({ it, i }) => c.pv
      ? `  <div class="qa"><b${ei(i, 'q')}>${esc(it.q)}</b><p${ei(i, 'a', 1)}>${esc(it.a)}</p></div>`
      : `  <details><summary>${esc(it.q)}</summary><p>${esc(it.a)}</p></details>`).join('\n')}
</div>`);
  },

  form(b, s, c) {
    const d = b.data, wa = digits(s.whatsapp);
    const f = [];
    if (d.askName) f.push('<input name="имя" placeholder="ваше имя" autocomplete="name">');
    if (d.askPhone) f.push('<input name="телефон" type="tel" placeholder="телефон" autocomplete="tel" required>');
    if (d.askMsg) f.push('<textarea name="комментарий" rows="3" placeholder="комментарий"></textarea>');
    const btn = c.pv ? `<div class="btn"${ed(b, c, 'button')}>${esc(d.button)}</div>` : `<button class="btn" type="submit">${esc(d.button)}</button>`;
    const form = `<form class="lead" data-wa="${wa}" data-href="${esc(c.cta)}" data-site="${esc(s.name)}"${c.pv ? ' onsubmit="return false"' : ''}>${f.join('')}${btn}</form>`;
    return wrap(b, c, {}, `<div class="wrap"><div class="box"><div class="fh">${h2(b, c)}${d.text || c.pv ? `<p${ed(b, c, 'text', { ml: 1 })}>${esc(d.text)}</p>` : ''}</div>${form}</div></div>`);
  },

  cta(b, s, c) {
    const d = b.data;
    return wrap(b, c, {}, `<div class="wrap"><div class="banner">${h2(b, c)}${d.text || c.pv ? `<p${ed(b, c, 'text', { ml: 1 })}>${esc(d.text)}</p>` : ''}${d.button ? `<a class="btn" href="${esc(c.cta)}"${ext(c.cta)}${ed(b, c, 'button')}>${esc(d.button)}</a>` : ''}</div></div>`);
  },

  contacts(b, s, c) {
    const d = b.data, v = b.variant || 1;
    const items = [];
    if (s.phone) items.push(['tel:' + String(s.phone).replace(/[^\d+]/g, ''), s.phone, '']);
    if (digits(s.whatsapp)) items.push(['https://wa.me/' + digits(s.whatsapp), 'whatsapp', 'https']);
    if (nick(s.telegram)) items.push(['https://t.me/' + nick(s.telegram), 'telegram', 'https']);
    if (nick(s.instagram)) items.push(['https://instagram.com/' + nick(s.instagram), 'instagram', 'https']);
    const links = items.map(([h, t, e]) => v === 2
      ? `<a class="btn" href="${esc(h)}"${e ? ' target="_blank" rel="noopener"' : ''}>${esc(t)}</a>`
      : `<a href="${esc(h)}"${e ? ' target="_blank" rel="noopener"' : ''}>${esc(t)}</a>`);
    const rows = [];
    if (s.address) rows.push(`<div>📍 ${esc(s.address)}${s.map ? ` — <a href="${esc(s.map)}" target="_blank" rel="noopener">на карте</a>` : ''}</div>`);
    if (s.hours) rows.push(`<div>🕒 ${esc(s.hours)}</div>`);
    if (d.note || c.pv) rows.push(`<div class="note"${ed(b, c, 'note', { ml: 1 })}>${esc(d.note)}</div>`);
    if (links.length) rows.push(`<div class="${v === 2 ? 'cbtns' : 'links'}">${links.join('')}</div>`);
    if (c.ph && !items.length && !s.address && !s.hours) rows.push('<div class="note">заполните контакты на вкладке «сайт»</div>');
    return wrap(b, c, {}, `<div class="wrap">${h2(b, c)}<div class="card cc">
${rows.join('\n')}
</div></div>`);
  },

  map(b, s, c) {
    const d = b.data;
    const src = mapSrc(d.embed, s.address);
    if (!src && !c.ph) return '';
    return wrap(b, c, {}, `<div class="wrap">${h2(b, c)}<div class="mapf">${src ? `<iframe src="${esc(src)}" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>` : '<div class="ph">укажите адрес на вкладке «сайт»</div>'}</div>${d.note || c.pv ? `<p class="tx"${ed(b, c, 'note', { ml: 1 })}>${esc(d.note)}</p>` : ''}</div>`);
  },

  video(b, s, c) {
    const d = b.data;
    const src = videoSrc(d.url);
    if (!src && !c.ph) return '';
    return wrap(b, c, {}, `<div class="wrap">${h2(b, c)}<div class="vid">${src ? `<iframe src="${esc(src)}" allowfullscreen loading="lazy"></iframe>` : '<div class="ph">вставьте ссылку на видео</div>'}</div></div>`);
  }
};

/* ---------- стили сайта ---------- */

function rootVars(s) {
  const t = THEMES[s.theme] || THEMES.sky;
  const accent = safeColor(s.accent, t.accent);
  const bg = safeColor(s.bg, t.bg);
  const fg = safeColor(s.fg, t.fg);
  const muted = s.fg ? `color-mix(in srgb,${fg} 62%,${bg})` : t.muted;
  const card = s.bg ? `color-mix(in srgb,${bg} 92%,${fg} 8%)` : t.card;
  const fh = (FONTS[s.fontHead] || FONTS.system).css;
  const fb = (FONTS[s.fontBody] || FONTS.system).css;
  const shape = { round: 'calc(var(--r) - 4px)', square: '6px', pill: '999px' }[s.btnShape] || 'calc(var(--r) - 4px)';
  const fill = s.btnLook !== 'outline';
  return `:root{--bg:${bg};--fg:${fg};--card:${card};--muted:${muted};--accent:${accent};--r:${t.radius}px;--br:${shape};--line:color-mix(in srgb,${fg} 12%,transparent);--fh:${fh};--fb:${fb};--btn-bg:${fill ? 'var(--accent)' : 'transparent'};--btn-fg:${fill ? '#fff' : 'var(--accent)'};--btn-bd:var(--accent);--btn-sh:${fill ? '0 8px 24px color-mix(in srgb,var(--accent) 33%,transparent)' : 'none'}}`;
}

function fontsLink(s) {
  const fam = [...new Set([s.fontHead, s.fontBody])].map(id => FONTS[id]).filter(f => f && f.g).map(f => 'family=' + f.g);
  return fam.length
    ? `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?${fam.join('&')}&display=swap">`
    : '';
}

const BASE_CSS = `*{box-sizing:border-box}
html{scroll-behavior:smooth}
body{margin:0;font-family:var(--fb);background:var(--bg);color:var(--fg);line-height:1.55;-webkit-font-smoothing:antialiased}
h1,h2,h3,h4{font-family:var(--fh);line-height:1.15;margin:0}
img{max-width:100%;display:block}
a{color:inherit}
.wrap{max-width:1040px;margin:0 auto;padding:0 20px}
.narrow{max-width:700px}
nav{position:sticky;top:0;z-index:20;background:color-mix(in srgb,var(--bg) 86%,transparent);backdrop-filter:blur(10px);border-bottom:1px solid var(--line)}
nav .wrap{display:flex;justify-content:space-between;align-items:center;height:62px;gap:16px}
nav .logo{font-family:var(--fh);font-size:19px}
nav .menu{display:flex;align-items:center;gap:20px}
nav .menu a{text-decoration:none;font-size:14px;opacity:.8}
nav .menu a:hover{opacity:1}
nav .menu a.btn{opacity:1;color:var(--btn-fg)}
.btn{display:inline-block;background:var(--btn-bg);color:var(--btn-fg);border:2px solid var(--btn-bd);text-decoration:none;font:inherit;font-weight:600;padding:13px 26px;border-radius:var(--br);cursor:pointer;box-shadow:var(--btn-sh);text-align:center}
.btn.sm{padding:8px 16px;font-size:14px;box-shadow:none}
.bk{position:relative;color:var(--fg)}
.pad-s{padding:32px 0}.pad-m{padding:56px 0}.pad-l{padding:96px 0}
.bg-alt{background:color-mix(in srgb,var(--fg) 5%,var(--bg))}
.bg-light{background:#fff;--fg:#12263a;--muted:#5d7185;--card:#f4f7fa;--line:#0000001a}
.bg-dark{background:#0f1218;--fg:#f3f4f8;--muted:#a3a9b8;--card:#1a1f2b;--line:#ffffff1f}
.bg-accent{background:var(--accent);--fg:#fff;--muted:rgba(255,255,255,.84);--card:rgba(255,255,255,.14);--line:rgba(255,255,255,.3);--btn-bg:#fff;--btn-fg:var(--accent);--btn-bd:#fff;--btn-sh:none}
.bg-accent .price,.bg-accent .num,.bg-accent .ic,.bg-accent .plan .pp{color:#fff}
.al-c{text-align:center}
.al-c .hero-p,.al-c .tx,.al-c .ab p{margin-left:auto;margin-right:auto}
.al-c .links,.al-c .cbtns{justify-content:center}
h2{font-size:clamp(26px,4vw,36px);margin:0 0 24px}
.tx{color:var(--muted);font-size:17px;white-space:pre-line;max-width:760px;margin:0}
.ph{background:color-mix(in srgb,var(--fg) 8%,transparent);display:grid;place-items:center;color:var(--muted);font-size:13px;border-radius:var(--r);min-height:110px}

.t-hero{background:radial-gradient(900px 420px at 82% -10%,color-mix(in srgb,var(--accent) 22%,transparent),transparent 62%),var(--bg);background-size:cover;background-position:center}
.t-hero.pad-s{padding:56px 0}.t-hero.pad-m{padding:100px 0 88px}.t-hero.pad-l{padding:150px 0 130px}
.t-hero h1{font-size:clamp(34px,6.4vw,60px);margin:0 0 16px;max-width:780px}
.t-hero p{font-size:19px;color:var(--muted);max-width:580px;margin:0 0 30px;white-space:pre-line}
.t-hero.v2{text-align:center}
.t-hero.v2 h1,.t-hero.v2 p{margin-left:auto;margin-right:auto}
.t-hero.v2 p{margin-bottom:30px}
.t-hero .split{display:grid;grid-template-columns:1.1fr 1fr;gap:44px;align-items:center}
.t-hero .pic img,.t-hero .pic .ph{width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:var(--r)}
.t-hero.bg-accent h1,.t-hero.bg-accent p{color:#fff}

.ab{display:grid;gap:32px;align-items:center}
.ab.two{grid-template-columns:1.15fr 1fr}
.ab h2{margin-bottom:14px}
.ab p{color:var(--muted);font-size:17px;margin:0;white-space:pre-line}
.ab .pic{width:100%;max-height:420px;object-fit:cover;border-radius:var(--r)}
.t-about.v2 .ab{text-align:center;max-width:780px;margin:0 auto}
.t-about.v2 .ab.two{grid-template-columns:1fr}
.t-about.v2 .ab .pic{order:-1}
.t-about.v2 .ab p{margin-left:auto;margin-right:auto}

.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:16px}
.card{background:var(--card);border:1px solid var(--line);border-radius:var(--r);padding:22px}
.card h4{font-size:17px;margin:0 0 6px}
.card p{margin:6px 0 0;color:var(--muted);font-size:14.5px;white-space:pre-line}
.price{color:var(--accent);font-weight:700;font-size:18px}
.ic{font-size:32px;margin-bottom:10px;line-height:1}
.t-features.v2 .card{background:transparent;border:0;padding:6px;text-align:center}

.rows .row{display:flex;justify-content:space-between;gap:20px;align-items:baseline;padding:16px 0;border-bottom:1px solid var(--line)}
.rows .row b{font-size:17px}
.rows .row p{margin:4px 0 0;color:var(--muted);font-size:14.5px;white-space:pre-line}
.rows .price{white-space:nowrap}

.plans{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:18px;align-items:stretch}
.plan{position:relative;display:flex;flex-direction:column}
.plan .pn{font-weight:700;font-size:17px}
.plan .pp{font-family:var(--fh);font-size:30px;font-weight:800;margin:8px 0 14px;color:var(--accent)}
.plan ul{list-style:none;padding:0;margin:0 0 22px;display:grid;gap:8px;color:var(--muted);font-size:14.5px;flex:1}
.plan li::before{content:'✓';color:var(--accent);font-weight:700;margin-right:8px}
.plan.hot{border:2px solid var(--accent)}
.plan .badge{position:absolute;top:-12px;left:20px;background:var(--accent);color:#fff;font-size:12px;font-weight:700;padding:3px 10px;border-radius:999px}

.steps{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px;counter-reset:s}
.step{counter-increment:s}
.step::before{content:counter(s);display:grid;place-items:center;width:38px;height:38px;border-radius:50%;background:var(--accent);color:#fff;font-weight:700;margin-bottom:12px}

.nums{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:20px;text-align:center}
.num{font-family:var(--fh);font-size:clamp(34px,5vw,48px);font-weight:800;color:var(--accent);line-height:1.1}
.nl{color:var(--muted);margin-top:6px;font-size:15px}

.team{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:22px;text-align:center}
.av{width:120px;height:120px;border-radius:50%;object-fit:cover;margin:0 auto 12px;background:color-mix(in srgb,var(--accent) 18%,transparent);display:grid;place-items:center;font-size:38px;font-weight:700;color:var(--accent)}
.team b{display:block}
.team span{color:var(--muted);font-size:14px}

.gal{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:10px}
.t-gallery.v2 .gal{grid-template-columns:1fr 1fr}
.gal img,.gal .ph{width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:var(--r)}

.rev q{display:block;quotes:none;font-size:16px;white-space:pre-line}
.rev small{display:block;margin-top:12px;color:var(--muted);font-weight:600}
.t-reviews.v2 .grid{grid-template-columns:1fr;max-width:760px}
.al-c.t-reviews.v2 .grid{margin:0 auto}
.t-reviews.v2 .rev q{font-size:21px;font-family:var(--fh)}
.t-reviews.v2 .rev q::before{content:'“';display:block;font-size:52px;line-height:1;color:var(--accent)}

details,.qa{background:var(--card);border:1px solid var(--line);border-radius:calc(var(--r) - 4px);padding:14px 18px;margin-bottom:10px}
summary,.qa b{cursor:pointer;font-weight:600;display:block}
details p,.qa p{color:var(--muted);margin:10px 0 0;white-space:pre-line}
.t-faq details,.t-faq .qa{max-width:760px}
.al-c.t-faq details,.al-c.t-faq .qa{margin-left:auto;margin-right:auto}

.lead{display:grid;gap:10px;margin-top:18px}
.lead input,.lead textarea{width:100%;padding:13px 14px;border:1px solid var(--line);border-radius:calc(var(--r) - 6px);font:inherit;background:var(--bg);color:var(--fg)}
.t-form .box{max-width:560px;margin:0 auto}
.t-form .fh h2{margin-bottom:8px}
.t-form .fh p{margin:0;color:var(--muted)}
.t-form.v1 .box{background:var(--card);border:1px solid var(--line);border-radius:var(--r);padding:30px}
.t-form.v2 .box{max-width:none;background:var(--accent);color:#fff;border-radius:var(--r);padding:38px;display:grid;grid-template-columns:1fr 1fr;gap:30px;align-items:center}
.t-form.v2 .fh p{color:rgba(255,255,255,.88)}
.t-form.v2 .lead{margin-top:0}
.t-form.v2 .btn{background:#fff;color:var(--accent);border-color:#fff;box-shadow:none}
.t-form.v2 input,.t-form.v2 textarea{background:#fff;color:#12263a;border-color:transparent}

.banner{background:var(--accent);color:#fff;border-radius:var(--r);padding:48px 28px;text-align:center}
.banner h2{margin:0 0 8px}
.banner p{margin:0 0 22px;opacity:.92}
.banner .btn{background:#fff;color:var(--accent);border-color:#fff;box-shadow:none}
.t-cta.v2 .banner{background:transparent;color:var(--fg);padding:16px 0}
.t-cta.v2 .banner .btn{background:var(--btn-bg);color:var(--btn-fg);border-color:var(--btn-bd);box-shadow:var(--btn-sh)}

.cc{display:grid;gap:12px}
.cc a{color:var(--accent);text-decoration:none;font-weight:600}
.cc .note{color:var(--muted);white-space:pre-line}
.cc .btn{color:var(--btn-fg)}
.links,.cbtns{display:flex;gap:16px;flex-wrap:wrap}
.cbtns{gap:10px}

.mapf,.vid{position:relative;border-radius:var(--r);overflow:hidden;border:1px solid var(--line)}
.mapf{aspect-ratio:16/8}
.vid{aspect-ratio:16/9;background:#000}
.mapf iframe,.vid iframe{position:absolute;inset:0;width:100%;height:100%;border:0}
.mapf .ph,.vid .ph{position:absolute;inset:0;border-radius:0}
.mapf+.tx{margin-top:14px}

footer{padding:30px 0 44px;text-align:center;color:var(--muted);font-size:13px}
.fab{position:fixed;right:18px;bottom:18px;z-index:25;width:56px;height:56px;border-radius:50%;background:#25d366;color:#fff;display:grid;place-items:center;font-size:26px;text-decoration:none;box-shadow:0 8px 24px #0004}
.rv{opacity:0;transform:translateY(18px);transition:opacity .6s ease,transform .6s ease}
.rv.in{opacity:1;transform:none}
@media(max-width:760px){
  nav .menu a:not(.btn){display:none}
  .t-hero.pad-m{padding:64px 0 52px}.t-hero.pad-l{padding:90px 0 70px}
  .t-hero .split,.ab.two,.t-form.v2 .box{grid-template-columns:1fr}
  .rows .row{flex-direction:column;gap:4px}
  .pad-l{padding:64px 0}
  .t-gallery.v2 .gal{grid-template-columns:1fr}
}`;

const PV_CSS = `
html{scroll-behavior:auto}
.sel{outline:3px solid #1a73e8;outline-offset:-3px}
[data-e]{outline:none;cursor:text;min-width:24px}
[data-e]:hover{background:rgba(26,115,232,.08);border-radius:4px}
[data-e]:focus{background:rgba(26,115,232,.12);box-shadow:0 0 0 2px #1a73e8aa;border-radius:4px}
[data-e]:empty::before{content:'текст';opacity:.35}
[data-img]{cursor:pointer}
[data-img]:hover{filter:brightness(.92)}
.tb{display:none;position:absolute;top:8px;right:10px;z-index:30;gap:2px;background:#1b1f27;border-radius:10px;padding:3px;box-shadow:0 6px 20px #0004}
[data-bid]:hover>.tb,.sel>.tb{display:flex}
.tb button{all:unset;cursor:pointer;color:#fff;padding:5px 9px;border-radius:7px;font:14px system-ui,sans-serif}
.tb button:hover{background:#ffffff26}
.ins{height:0;position:relative;z-index:25}
.ins::before{content:'';position:absolute;left:0;right:0;top:-16px;height:32px}
.ins button{display:none;position:absolute;left:50%;top:-15px;transform:translateX(-50%);background:#1a73e8;color:#fff;border:0;border-radius:999px;padding:6px 14px;font:600 13px system-ui,sans-serif;cursor:pointer;box-shadow:0 6px 18px #1a73e855;white-space:nowrap}
.ins:hover button{display:block}
.is-hidden{opacity:.35;outline:2px dashed #888;outline-offset:-2px}
.lead .btn{pointer-events:auto}`;

const PREVIEW_JS = `(function () {
  function path(el) { var d = el.dataset; return { bid: d.bid, k: d.k, i: d.i, sk: d.sk }; }
  function post(m) { parent.postMessage(m, '*'); }
  function pick(el) {
    var inp = document.createElement('input');
    inp.type = 'file'; inp.accept = 'image/*';
    inp.onchange = function () { if (inp.files[0]) post(Object.assign({ blokka: 'imgfile', file: inp.files[0] }, path(el))); };
    inp.click();
  }
  document.addEventListener('click', function (e) {
    var t = e.target;
    var a = t.closest('[data-a]');
    if (a) {
      e.preventDefault(); e.stopPropagation();
      var blk = a.closest('[data-bid]');
      post({ blokka: 'act', act: a.dataset.a, id: blk && blk.dataset.bid, idx: a.dataset.idx });
      return;
    }
    var im = t.closest('[data-img]');
    if (im) { e.preventDefault(); pick(im); }
    var link = t.closest('a[href]');
    if (link) {
      e.preventDefault();
      var h = link.getAttribute('href');
      if (h && h.charAt(0) === '#' && h.length > 1) { var x = document.getElementById(h.slice(1)); if (x) x.scrollIntoView({ behavior: 'smooth' }); }
    }
    var b = t.closest('[data-bid]');
    if (b) post({ blokka: 'select', id: b.dataset.bid });
  }, true);
  document.addEventListener('input', function (e) {
    var el = e.target.closest && e.target.closest('[data-e]');
    if (!el) return;
    var v = el.hasAttribute('data-ml') ? el.innerText : el.textContent;
    v = v.replace(/\\n+$/, '');
    if (el.dataset.se) post({ blokka: 'edit', se: el.dataset.se, value: v });
    else post(Object.assign({ blokka: 'edit', value: v }, path(el)));
  });
  document.addEventListener('keydown', function (e) {
    var el = e.target.closest && e.target.closest('[data-e]');
    if (el && e.key === 'Enter' && !el.hasAttribute('data-ml')) { e.preventDefault(); el.blur(); }
  });
  document.addEventListener('paste', function (e) {
    var el = e.target.closest && e.target.closest('[data-e]');
    if (!el) return;
    e.preventDefault();
    var txt = (e.clipboardData || window.clipboardData).getData('text/plain');
    if (!el.hasAttribute('data-ml')) txt = txt.replace(/\\s*\\n\\s*/g, ' ');
    document.execCommand('insertText', false, txt);
  });
  window.addEventListener('message', function (e) {
    var d = e.data;
    if (!d || d.blokka !== 'hl') return;
    var old = document.querySelector('.sel');
    if (old) old.classList.remove('sel');
    if (!d.id) return;
    var el = document.querySelector('section[data-bid="' + d.id + '"],header[data-bid="' + d.id + '"]');
    if (el) { el.classList.add('sel'); if (d.scroll) el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
  });
})();`;

const FORM_JS = `document.querySelectorAll('form.lead').forEach(function (f) {
  f.addEventListener('submit', function (e) {
    e.preventDefault();
    var wa = f.dataset.wa;
    if (!wa) { if (f.dataset.href && f.dataset.href !== '#') window.open(f.dataset.href, '_blank'); return; }
    var t = ['заявка с сайта ' + f.dataset.site];
    new FormData(f).forEach(function (v, k) { if (v) t.push(k + ': ' + v); });
    window.open('https://wa.me/' + wa + '?text=' + encodeURIComponent(t.join('\\n')), '_blank');
  });
});`;

const ANIM_JS = `(function () {
  if (!('IntersectionObserver' in window)) return;
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.08 });
  document.querySelectorAll('section.bk').forEach(function (el) { el.classList.add('rv'); io.observe(el); });
})();`;

const MENU_ORDER_LIMIT = 6;

function buildSite(st, pv) {
  const s = st.site;
  const t = THEMES[s.theme] || THEMES.sky;
  const c = { pv: !!pv, ph: !!pv, t, cta: ctaHref(st) };

  const seen = {};
  const menu = [];
  st.blocks.forEach(b => {
    const label = BLOCKS[b.type].menu;
    const set = b.set || {};
    if (!label || seen[b.type] || (set.hide && !pv)) return;
    seen[b.type] = true;
    if (b.type === 'gallery' && !pv && !(b.data.items || []).some(i => i.image)) return;
    if (b.type === 'map' && !pv && !mapSrc(b.data.embed, s.address)) return;
    menu.push(`<a href="#${b.id}">${label}</a>`);
  });
  const menuHtml = menu.slice(0, MENU_ORDER_LIMIT).join('') + (s.navBtn ? `<a class="btn sm" href="${esc(c.cta)}"${ext(c.cta)}>${esc(s.navBtn)}</a>` : '');

  let body = '';
  let hasForm = false;
  st.blocks.forEach((b, i) => {
    const h = RENDER[b.type](b, s, c);
    if (!h) return;
    if (b.type === 'form') hasForm = true;
    if (pv) body += `<div class="ins"><button data-a="ins" data-idx="${i}">＋ блок</button></div>\n`;
    body += h + '\n\n';
  });
  if (pv) body += `<div class="ins"><button data-a="ins" data-idx="${st.blocks.length}">＋ блок</button></div>\n`;

  const hero = st.blocks.find(b => b.type === 'hero');
  const title = s.seoTitle || s.name;
  const desc = s.seoDesc || (hero && hero.data.sub) || s.name;
  const og = /^https?:\/\//.test(s.ogImage || '') ? `\n<meta property="og:image" content="${esc(s.ogImage)}">` : '';
  const fav = s.favicon
    ? `\n<link rel="icon" href="data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">${esc(s.favicon)}</text></svg>`)}">` : '';
  const fab = s.floatWa && digits(s.whatsapp)
    ? `\n<a class="fab" href="https://wa.me/${digits(s.whatsapp)}" target="_blank" rel="noopener" aria-label="whatsapp">💬</a>` : '';
  const sign = s.showSign ? '<br>Создано @bauyrzhanov_12_' : '';
  const brand = `<b class="logo"${pv ? ' contenteditable="true" spellcheck="false" data-e data-se="name"' : ''}>${esc(s.name)}</b>`;
  const scripts = pv
    ? `\n<script>${PREVIEW_JS}</script>`
    : `${hasForm ? `\n<script>${FORM_JS}</script>` : ''}${s.anim ? `\n<script>${ANIM_JS}</script>` : ''}`;

  return `<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">${og}${fav}
${fontsLink(s)}
<style>
${rootVars(s)}
${BASE_CSS}${pv ? PV_CSS : ''}
</style>
</head>
<body>
<nav><div class="wrap">${brand}<div class="menu">${menuHtml}</div></div></nav>

${body}
<footer><div class="wrap">© ${new Date().getFullYear()} ${esc(s.name)}${sign}</div></footer>${fab}${scripts}
</body>
</html>`;
}

/* мини-превью блока для каталога */
function buildBlockPreview(type, variant, st) {
  const s = st.site;
  const b = { id: 'p', type, variant, data: BLOCKS[type].defaults(), set: defaultSet() };
  const c = { pv: false, ph: true, t: THEMES[s.theme] || THEMES.sky, cta: '#' };
  return `<!doctype html><html><head><meta charset="utf-8">${fontsLink(s)}<style>${rootVars(s)}\n${BASE_CSS}\nhtml{scroll-behavior:auto}</style></head><body>${RENDER[type](b, s, c)}</body></html>`;
}

/* ---------- готовые шаблоны ---------- */

function preset(o) {
  const set = bg => ({ bg });
  return {
    title: o.title, sub: o.sub,
    site: { name: o.name, theme: o.theme, hours: o.hours, fontHead: o.fontHead || 'system', fontBody: o.fontBody || 'system' },
    blocks: [
      { type: 'hero', variant: o.hero, data: { title: o.name, sub: o.tagline, cta: o.cta, image: '' } },
      { type: 'about', data: { title: 'о нас', text: o.about, image: '' } },
      { type: 'features', data: { title: 'почему мы', items: o.features.map(([icon, title, text]) => ({ icon, title, text })) } },
      { type: 'services', variant: o.services_v || 1, data: { title: 'услуги и цены', items: o.services.map(([title, price, desc]) => ({ title, price, desc: desc || '' })) } },
      { type: 'steps', set: set('alt'), data: { title: 'как это проходит', items: o.steps.map(([title, text]) => ({ title, text })) } },
      { type: 'gallery', data: { title: 'галерея', items: [{ image: '' }, { image: '' }, { image: '' }] } },
      { type: 'reviews', variant: 2, data: { title: 'отзывы', items: o.reviews.map(([name, text]) => ({ name, text })) } },
      { type: 'faq', set: set('alt'), data: { title: 'частые вопросы', items: o.faq.map(([q, a]) => ({ q, a })) } },
      { type: 'form', variant: 2, data: { title: o.ctaTitle, text: o.ctaText, button: o.cta, askName: true, askPhone: true, askMsg: false } },
      { type: 'contacts', data: { title: 'контакты', note: '' } }
    ]
  };
}

const PRESETS = {
  clinic: preset({
    title: 'клиника', sub: 'светлый и спокойный', theme: 'sky', hero: 3, hours: 'пн–сб 09:00–20:00', fontHead: 'manrope', fontBody: 'manrope',
    name: 'стоматология «улыбка»', tagline: 'лечим без боли и заботимся о вашей улыбке', cta: 'записаться на приём',
    about: 'современная клиника в центре города. опытные врачи, цифровая диагностика и честные цены без скрытых доплат.',
    features: [['🦷', 'безболезненно', 'современная анестезия и бережные методики.'], ['🔬', 'точная диагностика', 'цифровой снимок и план лечения до начала.'], ['🛡️', 'гарантия', 'даём гарантию на лечение и протезирование.']],
    services: [['консультация', 'бесплатно', 'осмотр и план лечения'], ['лечение кариеса', 'от 15 000 ₸'], ['профессиональная чистка', '18 000 ₸'], ['отбеливание', '45 000 ₸']],
    steps: [['запись', 'оставьте заявку, мы подберём удобное время.'], ['осмотр', 'врач осмотрит, сделает снимок и составит план.'], ['лечение', 'проводим лечение и даём рекомендации по уходу.']],
    reviews: [['айгерим', 'вылечили зуб без боли, объяснили каждый шаг. рекомендую.'], ['марат', 'приятная атмосфера и честная цена, пришёл по рекомендации друга.']],
    faq: [['нужна ли запись заранее?', 'да, так мы сможем уделить вам достаточно времени.'], ['есть ли гарантия на лечение?', 'да, срок зависит от вида услуги, подробности скажет врач.']],
    ctaTitle: 'запишитесь на консультацию', ctaText: 'ответим на вопросы и подберём время, которое удобно вам.'
  }),
  school: preset({
    title: 'школа / курсы', sub: 'тёплый и дружелюбный', theme: 'sun', hero: 2, hours: 'пн–сб 09:00–21:00', fontHead: 'nunito', fontBody: 'nunito',
    name: 'english school', tagline: 'заговорите на английском за 6 месяцев', cta: 'записаться на пробный урок',
    about: 'небольшие группы, живые преподаватели и разговорная практика на каждом занятии. первый урок бесплатно.',
    features: [['🗣️', 'разговорная практика', 'говорим на каждом занятии, а не только читаем.'], ['👥', 'малые группы', 'до 8 человек, чтобы каждому хватало внимания.'], ['🎯', 'под вашу цель', 'работа, переезд, ielts или путешествия.']],
    services: [['группа для взрослых', '28 000 ₸/мес', '2 раза в неделю'], ['группа для детей', '24 000 ₸/мес'], ['индивидуально', '6 000 ₸/урок'], ['подготовка к ielts', '35 000 ₸/мес']],
    steps: [['пробный урок', 'знакомимся и определяем ваш уровень.'], ['подбор группы', 'подбираем группу по уровню и расписанию.'], ['занятия', 'занимаемся и отслеживаем прогресс.']],
    reviews: [['динара, мама ученика', 'ребёнок бежит на занятия с удовольствием, уже заговорил.'], ['асхат', 'за полгода поднял уровень с нуля до b1, преподаватели супер.']],
    faq: [['с какого возраста берёте детей?', 'с 5 лет, группы формируются по возрасту.'], ['как проходит пробный урок?', 'знакомимся, определяем уровень и подбираем группу.']],
    ctaTitle: 'первый урок бесплатно', ctaText: 'запишитесь, и мы подберём группу под ваш уровень.'
  }),
  club: preset({
    title: 'клуб / игры', sub: 'тёмный и неоновый', theme: 'neon', hero: 1, hours: 'круглосуточно', services_v: 2, fontHead: 'unbounded', fontBody: 'inter',
    name: 'cyber club', tagline: 'мощные пк, быстрый интернет и своя атмосфера', cta: 'забронировать место',
    about: 'игровые зоны, vip-комнаты и буткемп для турниров. работаем круглосуточно, бронь через whatsapp.',
    features: [['🖥️', 'мощное железо', 'свежие видеокарты и мониторы с высокой частотой.'], ['⚡', 'быстрый интернет', 'низкий пинг для соревновательных игр.'], ['🏆', 'турниры', 'проводим турниры и тимбилдинги.']],
    services: [['стандарт', '1 000 ₸/час'], ['vip', '1 500 ₸/час'], ['ночной пакет', '4 500 ₸'], ['буткемп на 5 человек', '7 000 ₸/час']],
    steps: [['бронь', 'пишете в whatsapp и называете время.'], ['приходите', 'администратор встречает и проводит к месту.'], ['играете', 'играйте, заказывайте напитки прямо к месту.']],
    reviews: [['тимур', 'пинг низкий, железо мощное, на турнир собрались всей командой.'], ['данияр', 'чисто, удобные кресла, бронь прошла за минуту.']],
    faq: [['можно ли забронировать заранее?', 'да, напишите в whatsapp и назовите время.'], ['есть ли скидки?', 'ночной пакет и абонементы выходят выгоднее почасовой оплаты.']],
    ctaTitle: 'собирай команду и приходи', ctaText: 'бронь места занимает минуту.'
  }),
  cafe: preset({
    title: 'кафе / еда', sub: 'уютный и аппетитный', theme: 'brick', hero: 3, hours: 'ежедневно 10:00–23:00', fontHead: 'playfair', fontBody: 'inter',
    name: 'кафе «уют»', tagline: 'вкусно, быстро и по-домашнему', cta: 'заказать',
    about: 'готовим из свежих продуктов каждый день. есть доставка по городу и бронирование столов.',
    features: [['🥙', 'свежие продукты', 'готовим из свежего, без полуфабрикатов.'], ['🚚', 'доставка', 'привозим горячим по всему городу.'], ['💬', 'удобный заказ', 'можно заказать в whatsapp за минуту.']],
    services: [['шаурма классическая', '1 800 ₸'], ['бургер', '2 400 ₸'], ['кофе', 'от 900 ₸'], ['бизнес-ланч', '2 900 ₸']],
    steps: [['выбираете', 'смотрите меню и пишете нам.'], ['готовим', 'готовим заказ за 15–20 минут.'], ['получаете', 'забираете сами или заказываете доставку.']],
    reviews: [['алина', 'очень вкусно и быстро, доставили горячим.'], ['руслан', 'часто заказываем в офис, порции большие.']],
    faq: [['есть ли доставка?', 'да, по всему городу, время и стоимость уточняйте при заказе.'], ['можно ли заказать на мероприятие?', 'да, напишите нам за день.']],
    ctaTitle: 'проголодались?', ctaText: 'закажите прямо сейчас, доставим горячим.'
  })
};

/* ---------- состояние ---------- */

function fromPreset(id, keep) {
  const p = PRESETS[id];
  return {
    site: Object.assign(defaultSite(), p.site, keep || {}),
    blocks: p.blocks.map(b => ({
      id: uid(), type: b.type, variant: b.variant || 1,
      data: Object.assign(BLOCKS[b.type].defaults(), clone(b.data)),
      set: Object.assign(defaultSet(), b.set || {})
    })),
    selected: null
  };
}

function normalize(o) {
  if (!o || !Array.isArray(o.blocks) || !o.site) return null;
  const site = Object.assign(defaultSite(), o.site);
  if (!THEMES[site.theme]) site.theme = 'sky';
  const blocks = o.blocks.filter(b => b && BLOCKS[b.type]).map(b => {
    const n = BLOCKS[b.type].variants.length;
    return {
      id: b.id || uid(), type: b.type,
      variant: Math.min(Math.max(1, +b.variant || 1), n),
      data: Object.assign(BLOCKS[b.type].defaults(), b.data || {}),
      set: Object.assign(defaultSet(), b.set || {})
    };
  });
  return { site, blocks, selected: null };
}

if (typeof module !== 'undefined') {
  module.exports = { BLOCKS, RENDER, THEMES, FONTS, PRESETS, CATS, buildSite, buildBlockPreview, fromPreset, normalize, defaultSite, defaultSet, ctaHref, videoSrc, mapSrc };
}
