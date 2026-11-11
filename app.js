/* конструктор сайтов — всё работает в браузере, подходит для github pages */

const TEMPLATES = {
  clinic: {
    title: 'клиника', sub: 'светлый, спокойный',
    theme: { bg: '#f5f9fc', fg: '#12263a', card: '#ffffff', muted: '#5d7185', accent: '#1a8fd1', radius: '16px', dark: false },
    defaults: {
      name: 'стоматология «улыбка»', tagline: 'лечим без боли, заботимся о вашей улыбке',
      about: 'современная клиника в центре города. опытные врачи, цифровая диагностика и честные цены без скрытых доплат.',
      cta: 'записаться на приём',
      services: 'консультация | бесплатно | осмотр и план лечения\nлечение кариеса | от 15 000 ₸\nпрофессиональная чистка | 18 000 ₸\nотбеливание | 45 000 ₸',
      hours: 'пн–сб 09:00–20:00'
    }
  },
  school: {
    title: 'школа / курсы', sub: 'тёплый, дружелюбный',
    theme: { bg: '#fffaf0', fg: '#2a2217', card: '#ffffff', muted: '#7a6a52', accent: '#f08a24', radius: '20px', dark: false },
    defaults: {
      name: 'english school', tagline: 'заговорите на английском за 6 месяцев',
      about: 'небольшие группы, живые преподаватели и разговорная практика на каждом занятии. первый урок бесплатно.',
      cta: 'записаться на пробный урок',
      services: 'группа для взрослых | 28 000 ₸/мес | 2 раза в неделю\nгруппа для детей | 24 000 ₸/мес\nиндивидуально | 6 000 ₸/урок\nподготовка к ielts | 35 000 ₸/мес',
      hours: 'пн–сб 09:00–21:00'
    }
  },
  club: {
    title: 'клуб / игры', sub: 'тёмный, неоновый',
    theme: { bg: '#0d0d14', fg: '#f1f1f7', card: '#171724', muted: '#9a9ab3', accent: '#8b5cf6', radius: '14px', dark: true },
    defaults: {
      name: 'cyber club', tagline: 'мощные пк, быстрый интернет, своя атмосфера',
      about: 'игровые зоны, vip-комнаты и буткемп для турниров. работаем круглосуточно, бронь через whatsapp.',
      cta: 'забронировать место',
      services: 'стандарт | 1 000 ₸/час\nvip | 1 500 ₸/час\nночной пакет | 4 500 ₸\nbootcamp на 5 человек | 7 000 ₸/час',
      hours: 'круглосуточно'
    }
  },
  cafe: {
    title: 'кафе / еда', sub: 'уютный, аппетитный',
    theme: { bg: '#fff6ee', fg: '#2b1d14', card: '#ffffff', muted: '#85685a', accent: '#d9602b', radius: '22px', dark: false },
    defaults: {
      name: 'кафе «уют»', tagline: 'вкусно, быстро и по-домашнему',
      about: 'готовим из свежих продуктов каждый день. есть доставка по городу и бронирование столов.',
      cta: 'заказать',
      services: 'шаурма классическая | 1 800 ₸\nбургер | 2 400 ₸\nкофе | от 900 ₸\nбизнес-ланч | 2 900 ₸',
      hours: 'ежедневно 10:00–23:00'
    }
  }
};

const COMMON = {
  about: '', phone: '', whatsapp: '', instagram: '', telegram: '',
  address: '', map: '', heroImage: '', showSign: true
};

let state = load() || makeState('clinic');
let current = state.template;

function makeState(tpl) {
  const t = TEMPLATES[tpl];
  return Object.assign({}, COMMON, t.defaults, { template: tpl, accent: t.theme.accent });
}

function load() {
  try { return JSON.parse(localStorage.getItem('sitebuilder') || 'null'); } catch (e) { return null; }
}
function save() {
  try { localStorage.setItem('sitebuilder', JSON.stringify(state)); } catch (e) {}
}

/* ---------- генерация сайта ---------- */

const esc = s => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function parseServices(text) {
  return String(text || '').split('\n').map(l => l.trim()).filter(Boolean).map(l => {
    const p = l.split('|').map(x => x.trim());
    return { title: p[0] || '', price: p[1] || '', desc: p[2] || '' };
  });
}

function digits(s) { return String(s || '').replace(/\D/g, ''); }

function buildSite(s) {
  const t = TEMPLATES[s.template].theme;
  const accent = s.accent || t.accent;
  const services = parseServices(s.services);
  const wa = digits(s.whatsapp);
  const ctaHref = wa ? `https://wa.me/${wa}` : (s.telegram ? `https://t.me/${esc(s.telegram.replace('@', ''))}` : (s.phone ? `tel:${digits(s.phone)}` : '#contacts'));

  const links = [];
  if (s.phone) links.push(`<a href="tel:${esc(digits(s.phone))}">${esc(s.phone)}</a>`);
  if (wa) links.push(`<a href="https://wa.me/${wa}" target="_blank" rel="noopener">whatsapp</a>`);
  if (s.telegram) links.push(`<a href="https://t.me/${esc(s.telegram.replace('@', ''))}" target="_blank" rel="noopener">telegram</a>`);
  if (s.instagram) links.push(`<a href="https://instagram.com/${esc(s.instagram.replace('@', ''))}" target="_blank" rel="noopener">instagram</a>`);

  const heroBg = s.heroImage
    ? `background-image:linear-gradient(${t.dark ? 'rgba(13,13,20,.72),rgba(13,13,20,.9)' : 'rgba(255,255,255,.78),rgba(255,255,255,.92)'}),url('${esc(s.heroImage)}');background-size:cover;background-position:center;`
    : `background:radial-gradient(900px 400px at 80% -10%, ${accent}33, transparent 60%), ${t.bg};`;

  return `<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(s.name)}</title>
<meta name="description" content="${esc(s.tagline)}">
<style>
:root{--bg:${t.bg};--fg:${t.fg};--card:${t.card};--muted:${t.muted};--accent:${accent};--r:${t.radius}}
*{box-sizing:border-box}
html{scroll-behavior:smooth}
body{margin:0;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;background:var(--bg);color:var(--fg);line-height:1.55}
.wrap{max-width:1000px;margin:0 auto;padding:0 20px}
nav{position:sticky;top:0;z-index:5;background:${t.dark ? 'rgba(13,13,20,.85)' : 'rgba(255,255,255,.85)'};backdrop-filter:blur(10px);border-bottom:1px solid ${t.dark ? '#ffffff14' : '#00000010'}}
nav .wrap{display:flex;justify-content:space-between;align-items:center;height:60px}
nav b{font-size:18px}
nav a{color:var(--fg);text-decoration:none;margin-left:18px;font-size:14px;opacity:.8}
.hero{${heroBg}padding:88px 0 72px}
.hero h1{font-size:clamp(32px,6vw,56px);line-height:1.1;margin:0 0 14px}
.hero p{font-size:18px;color:var(--muted);max-width:560px;margin:0 0 28px}
.btn{display:inline-block;background:var(--accent);color:#fff;text-decoration:none;font-weight:600;padding:14px 26px;border-radius:calc(var(--r) - 4px);box-shadow:0 8px 24px ${accent}55}
section{padding:56px 0}
h2{font-size:28px;margin:0 0 20px}
.about{color:var(--muted);max-width:680px;font-size:17px;white-space:pre-line}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:14px}
.card{background:var(--card);border-radius:var(--r);padding:20px;border:1px solid ${t.dark ? '#ffffff12' : '#0000000d'}}
.card h4{margin:0 0 6px;font-size:17px}
.card .price{color:var(--accent);font-weight:700;font-size:18px}
.card p{margin:6px 0 0;color:var(--muted);font-size:14px}
.contacts .card{display:grid;gap:10px}
.contacts a{color:var(--accent);text-decoration:none;font-weight:600}
.links{display:flex;gap:14px;flex-wrap:wrap}
footer{padding:28px 0 40px;text-align:center;color:var(--muted);font-size:13px}
.wa{position:fixed;right:18px;bottom:18px;z-index:6}
@media(max-width:600px){nav a{display:none}.hero{padding:60px 0 48px}}
</style>
</head>
<body>
<nav><div class="wrap"><b>${esc(s.name)}</b><div><a href="#services">услуги</a><a href="#contacts">контакты</a></div></div></nav>

<header class="hero"><div class="wrap">
  <h1>${esc(s.name)}</h1>
  <p>${esc(s.tagline)}</p>
  <a class="btn" href="${ctaHref}" target="_blank" rel="noopener">${esc(s.cta || 'связаться')}</a>
</div></header>

${s.about ? `<section><div class="wrap"><h2>о нас</h2><div class="about">${esc(s.about)}</div></div></section>` : ''}

${services.length ? `<section id="services"><div class="wrap"><h2>услуги и цены</h2><div class="grid">
${services.map(x => `<div class="card"><h4>${esc(x.title)}</h4>${x.price ? `<div class="price">${esc(x.price)}</div>` : ''}${x.desc ? `<p>${esc(x.desc)}</p>` : ''}</div>`).join('\n')}
</div></div></section>` : ''}

<section id="contacts" class="contacts"><div class="wrap"><h2>контакты</h2><div class="card">
${s.address ? `<div>📍 ${esc(s.address)}${s.map ? ` — <a href="${esc(s.map)}" target="_blank" rel="noopener">на карте</a>` : ''}</div>` : ''}
${s.hours ? `<div>🕒 ${esc(s.hours)}</div>` : ''}
${links.length ? `<div class="links">${links.join('')}</div>` : ''}
</div></div></section>

<footer><div class="wrap">© ${new Date().getFullYear()} ${esc(s.name)}${s.showSign ? '<br>Создано @bauyrzhanov_12_' : ''}</div></footer>
</body>
</html>`;
}

/* ---------- интерфейс ---------- */

const frame = document.getElementById('frame');
let timer;
function render() {
  clearTimeout(timer);
  timer = setTimeout(() => { frame.srcdoc = buildSite(state); }, 120);
}

function fillForm() {
  document.querySelectorAll('[data-k]').forEach(el => {
    const k = el.dataset.k;
    if (el.type === 'checkbox') el.checked = !!state[k];
    else el.value = state[k] == null ? '' : state[k];
  });
}

function drawTemplates() {
  const box = document.getElementById('tpls');
  box.innerHTML = '';
  Object.entries(TEMPLATES).forEach(([id, t]) => {
    const b = document.createElement('button');
    b.className = 'tpl' + (state.template === id ? ' on' : '');
    b.innerHTML = `<b>${t.title}</b><span>${t.sub}</span>`;
    b.onclick = () => {
      if (state.template === id) return;
      if (!confirm('сменить шаблон? тексты заменятся примерами выбранного шаблона (контакты сохранятся).')) return;
      const keep = { phone: state.phone, whatsapp: state.whatsapp, instagram: state.instagram, telegram: state.telegram, address: state.address, map: state.map, heroImage: state.heroImage, showSign: state.showSign };
      state = Object.assign(makeState(id), keep);
      save(); fillForm(); drawTemplates(); render();
    };
    box.appendChild(b);
  });
}

document.getElementById('panel').addEventListener('input', e => {
  const k = e.target.dataset.k;
  if (!k) return;
  state[k] = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
  save(); render();
});

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
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

document.getElementById('btnZip').onclick = async () => {
  const zip = new JSZip();
  zip.file('index.html', buildSite(state));
  zip.file('.nojekyll', '');
  zip.file('README.txt', 'залей эти файлы в корень репозитория, затем settings → pages → deploy from a branch → main / root.');
  download(await zip.generateAsync({ type: 'blob' }), 'blokka-site.zip');
};

document.getElementById('btnExport').onclick = () =>
  download(new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' }), 'project.json');

document.getElementById('fileImport').onchange = e => {
  const f = e.target.files[0];
  if (!f) return;
  const r = new FileReader();
  r.onload = () => {
    try {
      const data = JSON.parse(r.result);
      if (!TEMPLATES[data.template]) throw new Error('bad');
      state = Object.assign(makeState(data.template), data);
      save(); fillForm(); drawTemplates(); render();
    } catch (err) { alert('не удалось прочитать файл проекта'); }
  };
  r.readAsText(f);
  e.target.value = '';
};

fillForm(); drawTemplates(); render();
