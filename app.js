/* blokka: редактор. правка прямо в превью, как в tilda. */
'use strict';

const $ = (s, r = document) => r.querySelector(s);

let state = load() || fromPreset('clinic');

function load() {
  try { return normalize(JSON.parse(localStorage.getItem('blokka') || 'null')); } catch (e) { return null; }
}
function save() {
  try { localStorage.setItem('blokka', JSON.stringify({ site: state.site, blocks: state.blocks })); }
  catch (e) { toast('не хватило места в браузере, сохрани проект в файл'); }
}
let saveTimer = null;
function saveSoon() { clearTimeout(saveTimer); saveTimer = setTimeout(save, 400); }

const findBlock = id => state.blocks.find(b => b.id === id);

function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(toast.t);
  toast.t = setTimeout(() => { t.hidden = true; }, 3500);
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

function commit(rebuild) {
  save();
  if (rebuild) renderBlocksTab();
  renderPreview();
}

function setValue(ds, v) {
  const b = findBlock(ds.bid);
  if (!b) return;
  if (ds.i != null) b.data[ds.k][+ds.i][ds.sk] = v;
  else b.data[ds.k] = v;
}

/* сообщения из превью */

window.addEventListener('message', e => {
  if (e.source !== frame.contentWindow) return;
  const d = e.data;
  if (!d || !d.blokka) return;
  if (d.blokka === 'select') return onSelect(d.id);
  if (d.blokka === 'edit') return onInlineEdit(d);
  if (d.blokka === 'imgfile') return onImgFile(d);
  if (d.blokka === 'act') return onAct(d);
});

function onSelect(id) {
  if (!findBlock(id)) return;
  setTab('blocks');
  if (state.selected !== id) {
    state.selected = id;
    renderBlocksTab();
    const open = $('.bcard.open');
    if (open) open.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
  highlight(id, false);
}

function onInlineEdit(d) {
  if (d.se) {
    state.site[d.se] = d.value;
    const inp = $(`#tabSite [data-s="${d.se}"]`);
    if (inp && inp.value !== d.value) inp.value = d.value;
    return saveSoon();
  }
  setValue(d, d.value);
  const sel = `#tabBlocks [data-bid="${d.bid}"][data-k="${d.k}"]` + (d.i != null ? `[data-i="${d.i}"][data-sk="${d.sk}"]` : '') + '[data-f]';
  const inp = $(sel);
  if (inp && inp.value !== d.value) inp.value = d.value;
  if (d.k === 'title' && d.i == null) {
    const sub = $(`#tabBlocks .bcard[data-id="${d.bid}"] .bsub`);
    if (sub) sub.textContent = String(d.value).slice(0, 26);
  }
  saveSoon();
}

async function onImgFile(d) {
  try {
    setValue(d, await resizeImage(d.file, 1400, 0.78));
    commit(true);
  } catch (err) { toast('не удалось прочитать картинку'); }
}

function onAct(d) {
  if (d.act === 'ins') return openCatalog(+d.idx);
  if (!findBlock(d.id)) return;
  if (d.act === 'up') return moveBlock(d.id, -1);
  if (d.act === 'down') return moveBlock(d.id, 1);
  if (d.act === 'dup') return dupBlock(d.id);
  if (d.act === 'del') return delBlock(d.id);
}

/* ---------- действия над блоками ---------- */

function moveBlock(id, delta) {
  const i = state.blocks.findIndex(b => b.id === id);
  const j = i + delta;
  if (i < 0 || j < 0 || j >= state.blocks.length) return;
  [state.blocks[i], state.blocks[j]] = [state.blocks[j], state.blocks[i]];
  commit(true);
}

function dupBlock(id) {
  const i = state.blocks.findIndex(b => b.id === id);
  if (i < 0) return;
  const copy = Object.assign(clone(state.blocks[i]), { id: uid() });
  state.blocks.splice(i + 1, 0, copy);
  state.selected = copy.id;
  scrollToSel = true;
  save();
  renderBlocksTab();
  renderPreview(true);
}

function delBlock(id) {
  if (!confirm('удалить блок?')) return;
  state.blocks = state.blocks.filter(b => b.id !== id);
  if (state.selected === id) state.selected = null;
  commit(true);
}

function addBlock(type, variant, idx) {
  const b = { id: uid(), type, variant: variant || 1, data: BLOCKS[type].defaults(), set: defaultSet() };
  const at = idx == null ? state.blocks.length : Math.min(Math.max(0, idx), state.blocks.length);
  state.blocks.splice(at, 0, b);
  state.selected = b.id;
  scrollToSel = true;
  setTab('blocks');
  save();
  renderBlocksTab();
  renderPreview(true);
  const open = $('.bcard.open');
  if (open) open.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

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
  if (f.t === 'check') return `<label class="check"><input type="checkbox" ${a} data-f${val ? ' checked' : ''}> ${esc(f.l)}</label>`;
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

const opts = (cur, list) => list.map(([v, n]) => `<option value="${v}"${cur === v ? ' selected' : ''}>${n}</option>`).join('');

function blockBody(b) {
  const def = BLOCKS[b.type];
  const set = b.set;
  return `<div class="bbody">
${def.fields.map(f => f.t === 'list' ? listHTML(b, f) : fieldHTML(f, b.data[f.k], { bid: b.id, k: f.k })).join('')}
${def.variants.length > 1 ? `<h3>вид блока</h3><div class="chips">${def.variants.map((n, i) => `<button class="chip${(b.variant || 1) === i + 1 ? ' on' : ''}" data-act="variant" data-v="${i + 1}">${esc(n)}</button>`).join('')}</div>` : ''}
<h3>настройки блока</h3>
<label>фон<select data-set="bg">${opts(set.bg, [['', 'как в теме'], ['alt', 'чуть другой'], ['light', 'светлый'], ['dark', 'тёмный'], ['accent', 'акцентный']])}</select></label>
<label>отступы<select data-set="pad">${opts(set.pad, [['s', 'маленькие'], ['m', 'обычные'], ['l', 'большие']])}</select></label>
<label>выравнивание<select data-set="align">${opts(set.align, [['left', 'слева'], ['center', 'по центру']])}</select></label>
<label class="check"><input type="checkbox" data-set="hide"${set.hide ? ' checked' : ''}> скрыть блок на сайте</label>
</div>`;
}

function blockCard(b) {
  const def = BLOCKS[b.type];
  const open = state.selected === b.id;
  const sub = String(b.data.title || b.data.text || '').slice(0, 26);
  return `<div class="bcard${open ? ' open' : ''}${b.set.hide ? ' off' : ''}" data-id="${b.id}">
  <div class="bhead" data-act="sel"><span class="grip" title="перетащить">⋮⋮</span><span class="bname">${def.icon} ${def.name}</span><span class="bsub">${esc(sub)}</span>
    <span class="bbtns"><button data-act="up" title="выше">↑</button><button data-act="down" title="ниже">↓</button><button data-act="dup" title="дублировать">⧉</button><button data-act="del" title="удалить">✕</button></span></div>${open ? blockBody(b) : ''}
</div>`;
}

function renderBlocksTab() {
  $('#tabBlocks').innerHTML = `<div class="blist">${state.blocks.map(blockCard).join('')}</div>
<button class="addbtn" data-act="catalog">+ добавить блок</button>`;
}

/* ---------- панель: сайт ---------- */

function renderSiteTab() {
  const s = state.site;
  const t = THEMES[s.theme] || THEMES.sky;
  const inp = (k, l, ph) => `<label>${l}<input data-s="${k}" value="${esc(s[k])}"${ph ? ` placeholder="${ph}"` : ''}></label>`;
  const sel = (k, l, list) => `<label>${l}<select data-s="${k}">${opts(s[k], list)}</select></label>`;
  const color = (k, l, def) => `<label>${l}<span class="crow"><input type="color" data-s="${k}" value="${esc(s[k] || def)}"><button class="mini" data-act="reset" data-key="${k}">как в теме</button></span></label>`;
  $('#tabSite').innerHTML = `
<h3>название</h3>
${inp('name', 'название сайта (шапка и подвал)')}
<h3>тема и цвета</h3>
<div class="themes">${Object.entries(THEMES).map(([k, th]) => `<button class="theme${s.theme === k ? ' on' : ''}" data-theme="${k}" style="--c:${th.accent};--b:${th.bg};color:${th.fg}"><i></i>${th.name}</button>`).join('')}</div>
${color('accent', 'акцентный цвет', t.accent)}
${color('bg', 'цвет фона', t.bg)}
${color('fg', 'цвет текста', t.fg)}
<h3>шрифты и кнопки</h3>
${sel('fontHead', 'шрифт заголовков', Object.entries(FONTS).map(([k, f]) => [k, f.name]))}
${sel('fontBody', 'шрифт текста', Object.entries(FONTS).map(([k, f]) => [k, f.name]))}
${sel('btnShape', 'форма кнопок', [['round', 'скруглённые'], ['square', 'прямые'], ['pill', 'таблетка']])}
${sel('btnLook', 'вид кнопок', [['fill', 'залитые'], ['outline', 'с обводкой']])}
${inp('navBtn', 'кнопка в шапке (текст, необязательно)', 'записаться')}
<h3>контакты</h3>
${inp('phone', 'телефон', '+7 777 123 45 67')}
${inp('whatsapp', 'whatsapp (номер)', '77771234567')}
${inp('telegram', 'telegram (ник)', 'my_business')}
${inp('instagram', 'instagram (ник)', 'my_business')}
${inp('address', 'адрес')}
${inp('hours', 'часы работы')}
${inp('map', 'ссылка на карту (2гис / google)')}
<h3>seo и соцсети</h3>
${inp('seoTitle', 'заголовок страницы (title)', 'если пусто, берётся название')}
${inp('seoDesc', 'описание (description)', 'если пусто, берётся подзаголовок')}
${inp('ogImage', 'картинка для превью в соцсетях (ссылка https)')}
${inp('favicon', 'иконка вкладки (один эмодзи)', '🦷')}
<h3>прочее</h3>
<label class="check"><input type="checkbox" data-s="anim"${s.anim ? ' checked' : ''}> плавное появление блоков при прокрутке</label>
<label class="check"><input type="checkbox" data-s="floatWa"${s.floatWa ? ' checked' : ''}> кнопка whatsapp в углу</label>
<label class="check"><input type="checkbox" data-s="showSign"${s.showSign ? ' checked' : ''}> подпись «Создано @bauyrzhanov_12_» в подвале</label>`;
}

function setTab(name) {
  document.querySelectorAll('.tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === name));
  $('#tabBlocks').hidden = name !== 'blocks';
  $('#tabSite').hidden = name !== 'site';
  if (name === 'site') renderSiteTab();
}

/* ---------- события панели ---------- */

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
  const val = el.type === 'checkbox' ? el.checked : el.value;
  if (el.dataset.f !== undefined) {
    setValue(el.dataset, val);
    if (el.dataset.k === 'title' && el.dataset.i === undefined) {
      const sub = el.closest('.bcard') && el.closest('.bcard').querySelector('.bsub');
      if (sub) sub.textContent = String(val).slice(0, 26);
    }
    commit(false);
  } else if (el.dataset.set !== undefined) {
    const b = findBlock(el.closest('.bcard').dataset.id);
    b.set[el.dataset.set] = val;
    if (el.dataset.set === 'hide') el.closest('.bcard').classList.toggle('off', !!val);
    commit(false);
  } else if (el.dataset.s) {
    state.site[el.dataset.s] = val;
    commit(false);
  }
});

panel.addEventListener('change', async e => {
  const el = e.target;
  if (el.dataset.up === undefined || !el.files || !el.files[0]) return;
  try {
    setValue(el.dataset, await resizeImage(el.files[0], 1400, 0.78));
    commit(true);
  } catch (err) { toast('не удалось прочитать картинку'); }
  el.value = '';
});

panel.addEventListener('click', e => {
  const t = e.target;
  const tab = t.closest('[data-tab]');
  if (tab) return setTab(tab.dataset.tab);
  const th = t.closest('[data-theme]');
  if (th) {
    Object.assign(state.site, { theme: th.dataset.theme, accent: '', bg: '', fg: '' });
    renderSiteTab();
    return commit(false);
  }
  const a = t.closest('[data-act]');
  if (!a) return;
  const card = a.closest('.bcard');
  const id = card && card.dataset.id;
  const ds = a.dataset;

  switch (ds.act) {
    case 'catalog': return openCatalog(null);
    case 'sel':
      state.selected = state.selected === id ? null : id;
      renderBlocksTab();
      return highlight(state.selected, true);
    case 'up': return moveBlock(id, -1);
    case 'down': return moveBlock(id, 1);
    case 'dup': return dupBlock(id);
    case 'del': return delBlock(id);
    case 'variant':
      findBlock(id).variant = +ds.v;
      return commit(true);
    case 'imgurl': {
      const u = prompt('ссылка на картинку (https://...)');
      if (u && u.trim()) { setValue(ds, u.trim()); commit(true); }
      return;
    }
    case 'imgclr':
      setValue(ds, '');
      return commit(true);
    case 'reset':
      state.site[ds.key] = '';
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
const unlockCards = () => document.querySelectorAll('.bcard[draggable="true"]').forEach(x => { x.draggable = false; });

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
panel.addEventListener('dragend', () => { unlockCards(); dragId = null; clearMarks(); });
document.addEventListener('mouseup', () => { if (!dragId) unlockCards(); });

/* ---------- каталог блоков ---------- */

const cat = $('#cat');
let insertAt = null;

function openCatalog(idx) {
  insertAt = idx;
  const chips = [['all', 'все'], ...CATS];
  const cards = Object.entries(BLOCKS).flatMap(([type, def]) => def.variants.map((vn, vi) =>
    `<div class="ccard" role="button" tabindex="0" data-type="${type}" data-v="${vi + 1}" data-cat="${def.cat}">
  <div class="cprev"><iframe tabindex="-1" loading="lazy" srcdoc="${esc(buildBlockPreview(type, vi + 1, state))}"></iframe></div>
  <span>${def.icon} ${def.name}${def.variants.length > 1 ? ` · ${esc(vn)}` : ''}</span></div>`));
  cat.innerHTML = `<div class="dhead"><b>выбери блок</b><button data-close>✕</button></div>
<div class="chips fchips">${chips.map(([id, n], k) => `<button class="chip${k ? '' : ' on'}" data-fcat="${id}">${n}</button>`).join('')}</div>
<div class="cgrid">${cards.join('')}</div>`;
  cat.showModal();
}

cat.addEventListener('click', e => {
  if (e.target === cat || e.target.closest('[data-close]')) return cat.close();
  const f = e.target.closest('[data-fcat]');
  if (f) {
    cat.querySelectorAll('[data-fcat]').forEach(x => x.classList.toggle('on', x === f));
    cat.querySelectorAll('.ccard').forEach(c => { c.hidden = f.dataset.fcat !== 'all' && c.dataset.cat !== f.dataset.fcat; });
    return;
  }
  const c = e.target.closest('.ccard');
  if (!c) return;
  cat.close();
  addBlock(c.dataset.type, +c.dataset.v, insertAt);
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
<p class="hint">шаблон заменит блоки, тему и шрифты. контакты и подпись сохранятся.</p>
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
