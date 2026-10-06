export function createIcon(name, { size, label } = {}) {
  const el = document.createElement('span');
  el.className = 'icon';
  el.style.setProperty('--icon', `url(/src/assets/${name}.svg)`);

  if (size) el.style.setProperty('--icon-size', size);

  if (label) {
    el.setAttribute('role', 'img');
    el.setAttribute('aria-label', label);
  } else {
    el.setAttribute('aria-hidden', 'true');
  }
  return el;
}
