const form = document.querySelector('#item-form');
const srcInput = document.querySelector('#item-src');
const typeInput = document.querySelector('#item-type');
const sectionInput = document.querySelector('#item-section');
const titleInput = document.querySelector('#item-title');
const captionInput = document.querySelector('#item-caption');
const clearFormBtn = document.querySelector('#clear-form');
const loadProjectXmlBtn = document.querySelector('#load-project-xml');
const importXmlBtn = document.querySelector('#import-xml');
const exportXmlBtn = document.querySelector('#export-xml');
const saveXmlBtn = document.querySelector('#save-xml');
const importFileInput = document.querySelector('#import-file');
const itemsList = document.querySelector('#items-list');
const statusText = document.querySelector('#status-text');

let items = [];

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function escapeXml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function setStatus(message) {
  statusText.textContent = message;
}

function clearForm() {
  srcInput.value = '';
  typeInput.value = 'image';
  sectionInput.value = '';
  titleInput.value = '';
  captionInput.value = '';
}

function renderList() {
  if (!items.length) {
    itemsList.innerHTML = '<p class="gallery-empty">Sem itens no editor.</p>';
    return;
  }

  itemsList.innerHTML = items
    .map((item, index) => {
      const safeTitle = escapeHtml(item.title || 'Sem titulo');
      const safeSection = escapeHtml(item.section || 'Sem secao');
      const safeType = escapeHtml(item.type || 'image');
      const safeSrc = escapeHtml(item.src || '');
      const safeCaption = escapeHtml(item.caption || '-');
      const preview =
        item.type === 'video'
          ? `<video class="item-thumb" controls preload="metadata"><source src="${safeSrc}" /></video>`
          : `<img class="item-thumb" src="${safeSrc}" alt="${safeTitle}" loading="lazy" />`;

      return `
        <div class="item-row">
          <div class="item-head">
            ${preview}
            <div class="item-meta">
              <h4>${safeTitle}</h4>
              <label class="inline-field">
                <span>Secao</span>
                <input type="text" data-field="section" data-index="${index}" value="${safeSection}" />
              </label>
              <p><strong>Tipo:</strong> ${safeType}</p>
              <p><strong>Arquivo:</strong> ${safeSrc}</p>
              <label class="inline-field">
                <span>Legenda</span>
                <textarea data-field="caption" data-index="${index}" rows="2">${safeCaption === '-' ? '' : safeCaption}</textarea>
              </label>
            </div>
          </div>
          <div class="actions">
            <button type="button" data-delete="${index}">Excluir</button>
          </div>
        </div>
      `;
    })
    .join('');
}

function toXml(itemsData) {
  const sectionMap = new Map();

  itemsData.forEach((item) => {
    const key = item.section.trim() || 'Sem secao';
    if (!sectionMap.has(key)) {
      sectionMap.set(key, []);
    }

    sectionMap.get(key).push(item);
  });

  const lines = ['<?xml version="1.0" encoding="UTF-8"?>', '<gallery updated="2026-07-28">'];

  for (const [sectionName, sectionItems] of sectionMap.entries()) {
    lines.push(`  <section name="${escapeXml(sectionName)}">`);

    sectionItems.forEach((item) => {
      lines.push(
        `    <item type="${escapeXml(item.type)}" src="${escapeXml(item.src)}" title="${escapeXml(item.title)}" caption="${escapeXml(item.caption)}" />`
      );
    });

    lines.push('  </section>');
  }

  lines.push('</gallery>');
  return lines.join('\n');
}

function parseXml(xmlText) {
  const parser = new DOMParser();
  const xml = parser.parseFromString(xmlText, 'application/xml');
  const parseError = xml.querySelector('parsererror');

  if (parseError) {
    throw new Error('XML invalido.');
  }

  const loadedItems = [];
  const sections = [...xml.querySelectorAll('section')];

  sections.forEach((section) => {
    const sectionName = section.getAttribute('name') || 'Sem secao';
    const sectionItems = [...section.querySelectorAll('item')];

    sectionItems.forEach((item) => {
      loadedItems.push({
        src: item.getAttribute('src') || '',
        type: (item.getAttribute('type') || 'image').toLowerCase(),
        section: sectionName,
        title: item.getAttribute('title') || 'Sem titulo',
        caption: item.getAttribute('caption') || ''
      });
    });
  });

  return loadedItems;
}

form.addEventListener('submit', (event) => {
  event.preventDefault();

  const item = {
    src: srcInput.value.trim(),
    type: typeInput.value,
    section: sectionInput.value.trim(),
    title: titleInput.value.trim(),
    caption: captionInput.value.trim()
  };

  if (!item.src || !item.section || !item.title) {
    setStatus('Preencha caminho, secao e titulo.');
    return;
  }

  items.push(item);
  renderList();
  clearForm();
  setStatus('Item adicionado.');
});

clearFormBtn.addEventListener('click', () => {
  clearForm();
  setStatus('Formulario limpo.');
});

itemsList.addEventListener('click', (event) => {
  const target = event.target;
  if (!(target instanceof HTMLButtonElement)) {
    return;
  }

  const deleteIndex = target.dataset.delete;

  if (deleteIndex !== undefined) {
    items.splice(Number(deleteIndex), 1);
    renderList();
    setStatus('Item removido.');
  }
});

itemsList.addEventListener('input', (event) => {
  const target = event.target;
  if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) {
    return;
  }

  const field = target.dataset.field;
  const index = Number(target.dataset.index);
  const item = items[index];

  if (!item || !field) {
    return;
  }

  if (field === 'section') {
    item.section = target.value;
    setStatus('Secao atualizada. Clique em Exportar XML ou Salvar XML para gravar tudo.');
    return;
  }

  if (field === 'caption') {
    item.caption = target.value;
    setStatus('Legenda atualizada. Clique em Exportar XML ou Salvar XML para gravar tudo.');
  }
});

loadProjectXmlBtn.addEventListener('click', async () => {
  try {
    const response = await fetch('galery/galeria.xml', { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`Erro ${response.status}`);
    }

    const xmlText = await response.text();
    items = parseXml(xmlText);
    renderList();
    setStatus('XML do projeto carregado.');
  } catch (error) {
    setStatus(`Nao foi possivel carregar XML do projeto: ${error.message}`);
  }
});

importXmlBtn.addEventListener('click', () => {
  importFileInput.click();
});

importFileInput.addEventListener('change', async () => {
  const file = importFileInput.files?.[0];
  if (!file) {
    return;
  }

  try {
    const xmlText = await file.text();
    items = parseXml(xmlText);
    renderList();
    setStatus('XML importado com sucesso.');
  } catch (error) {
    setStatus(`Falha ao importar XML: ${error.message}`);
  }
});

exportXmlBtn.addEventListener('click', () => {
  const xmlContent = toXml(items);
  const blob = new Blob([xmlContent], { type: 'application/xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'galeria.xml';
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  setStatus('Arquivo XML exportado para download.');
});

saveXmlBtn.addEventListener('click', async () => {
  const xmlContent = toXml(items);

  if (!window.showSaveFilePicker) {
    setStatus('Seu navegador nao permite salvar direto. Use Exportar XML.');
    return;
  }

  try {
    const handle = await window.showSaveFilePicker({
      suggestedName: 'galeria.xml',
      types: [
        {
          description: 'Arquivo XML',
          accept: { 'application/xml': ['.xml'] }
        }
      ]
    });

    const writable = await handle.createWritable();
    await writable.write(xmlContent);
    await writable.close();
    setStatus('XML salvo no arquivo local escolhido.');
  } catch (error) {
    setStatus(`Salvamento cancelado ou falhou: ${error.message}`);
  }
});

renderList();
setStatus('Abra o XML do projeto ou cadastre novos itens.');
