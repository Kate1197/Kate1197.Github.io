/* ===== 移动端 App 化外壳 =====
   仅在 ≤767px 注入底部导航；桌面/平板不生成任何额外 DOM。
   不依赖任何页面内部 JS，可随 CSS 一起整体移除。 */
(function () {
  'use strict';
  if (window.__amiAppNav) return;
  window.__amiAppNav = true;

  var MQ = window.matchMedia('(max-width: 767px)');
  var bar = null;
  var sheet = null;

  var ICO = {
    home: '<path d="M3 9.6 12 2.5l9 7.1V20a1.5 1.5 0 0 1-1.5 1.5H4.5A1.5 1.5 0 0 1 3 20Z"/><path d="M9.5 21.5v-7h5v7"/>',
    quote: '<rect x="3.5" y="4.5" width="17" height="15" rx="2.2"/><path d="M7.5 9h9M7.5 12.5h9M7.5 16h5"/>',
    calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="2.2"/><path d="M3.5 9.5h17M8 3v4M16 3v4"/>',
    layers: '<path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5"/><path d="m3 16.5 9 5 9-5"/>',
    grid: '<rect x="3.5" y="3.5" width="7" height="7" rx="1.7"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.7"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.7"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.7"/>',
    mic: '<rect x="9" y="2.5" width="6" height="11" rx="3"/><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3.5M8.5 21.5h7"/>',
    case: '<rect x="2.8" y="7.5" width="18.4" height="13" rx="2.2"/><path d="M8.5 7.5V5.2A1.7 1.7 0 0 1 10.2 3.5h3.6a1.7 1.7 0 0 1 1.7 1.7v2.3M2.8 12.5h18.4"/>',
    heart: '<path d="M12 20.5S3.5 15.2 3.5 9.3a4.8 4.8 0 0 1 8.5-3.1 4.8 4.8 0 0 1 8.5 3.1c0 5.9-8.5 11.2-8.5 11.2Z"/>',
    doc: '<path d="M6 2.8h7.5L19 8.3v12.9H6z"/><path d="M13.5 2.8v5.5H19M9 12.5h7M9 16h5"/>'
  };

  var TABS = [
    { id: 'home', label: '首页', href: 'index.html', icon: 'home' },
    { id: 'riqian', label: '日签', href: 'riqian.html', icon: 'quote' },
    { id: 'xingcheng', label: '行程', href: 'xingcheng.html', icon: 'calendar' },
    { id: 'chanchu', label: '产出', href: 'chanchu.html', icon: 'layers' },
    { id: 'more', label: '更多', icon: 'grid' }
  ];

  var MORE = [
    { label: '采访合集', href: 'interview.html', icon: 'mic' },
    { label: '商务代言', href: 'brands.html', icon: 'case' },
    { label: '艾心向善', href: 'aixin.html', icon: 'heart' },
    { label: '站点日志', href: 'blog.html', icon: 'doc' }
  ];

  function svg(name, size) {
    return '<svg viewBox="0 0 24 24" width="' + (size || 21) + '" height="' + (size || 21) +
      '" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" ' +
      'stroke-linejoin="round" aria-hidden="true">' + ICO[name] + '</svg>';
  }

  function currentFile() {
    return (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  }

  function activeId() {
    var file = currentFile();
    var hash = (location.hash || '').toLowerCase();
    if (file === '' || file === 'index.html') {
      return hash.indexOf('riqian') > -1 ? 'riqian' : 'home';
    }
    if (file === 'riqian.html') return 'riqian';
    if (file === 'xingcheng.html') return 'xingcheng';
    if (file === 'chanchu.html') return 'chanchu';
    if (file === 'interview.html' || file === 'brands.html' || file === 'aixin.html' || file === 'blog.html') return 'more';
    return 'home';
  }

  function setActive() {
    if (!bar) return;
    var id = activeId();
    Array.prototype.forEach.call(bar.querySelectorAll('.app-tab'), function (el) {
      var on = el.getAttribute('data-tab') === id;
      el.classList.toggle('active', on);
      if (on) el.setAttribute('aria-current', 'page');
      else el.removeAttribute('aria-current');
    });
  }

  function openSheet() {
    if (!sheet) return;
    sheet.classList.add('open');
    document.body.classList.add('app-sheet-open');
  }

  function closeSheet() {
    if (!sheet) return;
    sheet.classList.remove('open');
    document.body.classList.remove('app-sheet-open');
  }

  function buildSheet() {
    var el = document.createElement('div');
    el.className = 'app-sheet';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    el.setAttribute('aria-label', '更多页面');

    var html = '<div class="app-sheet-backdrop" data-close="1"></div>' +
      '<div class="app-sheet-panel">' +
      '<div class="app-sheet-grip"></div>' +
      '<div class="app-sheet-title">更多页面</div>' +
      '<div class="app-sheet-list">';

    MORE.forEach(function (m) {
      html += '<a class="app-sheet-item" href="' + m.href + '">' + svg(m.icon, 19) +
        '<span>' + m.label + '</span></a>';
    });

    html += '</div></div>';
    el.innerHTML = html;

    el.addEventListener('click', function (e) {
      if (e.target.closest('[data-close]') || e.target.closest('.app-sheet-item')) closeSheet();
    });

    document.body.appendChild(el);
    return el;
  }

  function buildBar() {
    var el = document.createElement('nav');
    el.className = 'app-tabbar';
    el.setAttribute('aria-label', '底部导航');

    TABS.forEach(function (t) {
      var node;
      if (t.id === 'more') {
        node = document.createElement('button');
        node.type = 'button';
      } else {
        node = document.createElement('a');
        node.href = t.href;
      }
      node.className = 'app-tab';
      node.setAttribute('data-tab', t.id);
      node.innerHTML = '<span class="app-tab-ico">' + svg(t.icon) + '</span><span>' + t.label + '</span>';
      if (t.id === 'more') {
        node.setAttribute('aria-label', '更多页面');
        node.setAttribute('aria-expanded', 'false');
        node.addEventListener('click', function () {
          if (sheet) {
            var open = sheet.classList.contains('open');
            node.setAttribute('aria-expanded', open ? 'false' : 'true');
            open ? closeSheet() : openSheet();
          }
        });
      }
      el.appendChild(node);
    });

    document.body.appendChild(el);
    return el;
  }

  function mount() {
    if (bar) return;
    bar = buildBar();
    sheet = buildSheet();
    setActive();
    window.addEventListener('hashchange', setActive);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeSheet();
    });
  }

  function unmount() {
    if (bar && bar.parentNode) bar.parentNode.removeChild(bar);
    if (sheet && sheet.parentNode) sheet.parentNode.removeChild(sheet);
    bar = null;
    sheet = null;
    document.body.classList.remove('app-sheet-open');
  }

  function apply() {
    if (MQ.matches) mount();
    else unmount();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', apply);
  } else {
    apply();
  }

  var onChange = function () { apply(); };
  if (MQ.addEventListener) MQ.addEventListener('change', onChange);
  else if (MQ.addListener) MQ.addListener(onChange);
})();
