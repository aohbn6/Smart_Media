/*
 * template.js
 * Fills the <template id="tpl"> in index.html with data.
 *   {{path.to.value}}           → replaced with the value (text or attribute)
 *   onClick="{{fn}}"            → click handler
 *   onAnimationEnd="{{fn}}"     → runs when that element's CSS animation finishes
 *   <sc-for list="{{x}}" as="y"> → repeats children for each item in x
 *   <sc-if value="{{x}}">        → shows children only if x is truthy
 * Re-renders are patched into the page with morphdom so animations and
 * typed form values are not reset.
 */
(function () {
  var HOLE = /\{\{\s*([^}]+?)\s*\}\}/g;
  var actions = [];

  function resolve(path, scope) {
    path = path.trim();
    if (path === 'true') return true;
    if (path === 'false') return false;
    if (/^-?\d+(\.\d+)?$/.test(path)) return Number(path);
    var v = scope;
    var keys = path.split('.');
    for (var i = 0; i < keys.length; i++) {
      if (v == null) return undefined;
      v = v[keys[i]];
    }
    return v;
  }
  function fill(str, scope) {
    return str.replace(HOLE, function (_, p) {
      var v = resolve(p, scope);
      return v == null ? '' : String(v);
    });
  }
  function whole(str) {
    var m = /^\s*\{\{\s*([^}]+?)\s*\}\}\s*$/.exec(str || '');
    return m ? m[1] : null;
  }
  function child(scope, extra) {
    var o = Object.create(scope);
    for (var k in extra) o[k] = extra[k];
    return o;
  }
  function renderNodes(nodes, scope, out) {
    for (var i = 0; i < nodes.length; i++) renderNode(nodes[i], scope, out);
  }
  function renderNode(n, scope, out) {
    if (n.nodeType === 3) { out.appendChild(document.createTextNode(fill(n.nodeValue, scope))); return; }
    if (n.nodeType !== 1) return;
    var tag = n.localName;
    if (tag === 'sc-for') {
      var list = resolve(whole(n.getAttribute('list')), scope) || [];
      var as = n.getAttribute('as') || 'item';
      list.forEach(function (item, i) {
        var extra = {}; extra[as] = item; extra.$index = i;
        renderNodes(n.childNodes, child(scope, extra), out);
      });
      return;
    }
    if (tag === 'sc-if') {
      if (resolve(whole(n.getAttribute('value')), scope)) renderNodes(n.childNodes, scope, out);
      return;
    }
    var svg = n.namespaceURI === 'http://www.w3.org/2000/svg';
    var el = svg ? document.createElementNS(n.namespaceURI, n.tagName) : document.createElement(tag);
    for (var a = 0; a < n.attributes.length; a++) {
      var at = n.attributes[a];
      if (at.name.indexOf('hint-') === 0) continue;
      if (at.name.indexOf('on') === 0) {
        var fn = resolve(whole(at.value) || '', scope);
        if (typeof fn === 'function') {
          actions.push(fn);
          el.setAttribute(at.name === 'onanimationend' ? 'data-end' : 'data-act', String(actions.length - 1));
        }
        continue;
      }
      if (at.name === 'data-opts') {
        (resolve(at.value, scope) || []).forEach(function (o) {
          var op = document.createElement('option'); op.textContent = o.txt; el.appendChild(op);
        });
        continue;
      }
      el.setAttribute(at.name, fill(at.value, scope));
    }
    renderNodes(n.childNodes, scope, el);
    out.appendChild(el);
  }

  function render(app, tpl, vals) {
    actions = [];
    var fresh = document.createElement('div');
    renderNodes(tpl.content.childNodes, vals, fresh);
    if (!app.querySelector('.sm-root')) {
      app.innerHTML = '';
      while (fresh.firstChild) app.appendChild(fresh.firstChild);
      return;
    }
    morphdom(app, fresh, {
      childrenOnly: true,
      onBeforeElUpdated: function (from, to) {
        if (from.tagName === 'INPUT' || from.tagName === 'TEXTAREA') {
          if (to.hasAttribute('placeholder')) from.setAttribute('placeholder', to.getAttribute('placeholder'));
          return false;
        }
        if (from.tagName === 'SELECT') {
          var idx = from.selectedIndex;
          setTimeout(function () { from.selectedIndex = idx; });
        }
        if (from.tagName === 'DETAILS') {
          if (from.open) to.setAttribute('open', ''); else to.removeAttribute('open');
        }
        return true;
      }
    });
  }

  function bindClicks(app) {
    app.addEventListener('click', function (e) {
      var el = e.target.closest('[data-act]');
      if (!el || !app.contains(el)) return;
      var fn = actions[+el.getAttribute('data-act')];
      if (fn) fn(e);
    });
    // Animation-driven actions (e.g. the slide timer moving to the next slide).
    app.addEventListener('animationend', function (e) {
      var el = e.target;
      if (!el.hasAttribute || !el.hasAttribute('data-end')) return;
      var fn = actions[+el.getAttribute('data-end')];
      if (fn) fn(e);
    });
  }

  window.SmartTemplate = { render: render, bindClicks: bindClicks };
})();
