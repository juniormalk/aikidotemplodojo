const galleryRoot = document.querySelector('#gallery-sections');
let galleryModal = null;
let galleryModalImage = null;

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function ensureGalleryModal() {
  if (galleryModal && galleryModalImage) {
    return;
  }

  const modal = document.createElement('div');
  modal.className = 'gallery-modal';
  modal.setAttribute('aria-hidden', 'true');
  modal.innerHTML = `
    <div class="gallery-modal-backdrop" data-close-modal="true"></div>
    <div class="gallery-modal-dialog" role="dialog" aria-modal="true" aria-label="Foto ampliada">
      <button type="button" class="gallery-modal-close" aria-label="Fechar foto">Fechar</button>
      <img class="gallery-modal-image" src="" alt="" />
    </div>
  `;

  document.body.append(modal);
  galleryModal = modal;
  galleryModalImage = modal.querySelector('.gallery-modal-image');

  modal.addEventListener('click', (event) => {
    const target = event.target;
    if (target instanceof HTMLElement && (target.dataset.closeModal === 'true' || target.classList.contains('gallery-modal-close'))) {
      closeGalleryModal();
    }
  });
}

function openGalleryModal(src, altText) {
  ensureGalleryModal();
  if (!galleryModal || !galleryModalImage) {
    return;
  }

  galleryModalImage.src = src;
  galleryModalImage.alt = altText || 'Foto ampliada';
  galleryModal.classList.add('is-open');
  galleryModal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('gallery-modal-open');
}

function closeGalleryModal() {
  if (!galleryModal || !galleryModalImage) {
    return;
  }

  galleryModal.classList.remove('is-open');
  galleryModal.setAttribute('aria-hidden', 'true');
  galleryModalImage.src = '';
  document.body.classList.remove('gallery-modal-open');
}

function renderGallery(xmlText) {
  const parser = new DOMParser();
  const xml = parser.parseFromString(xmlText, 'application/xml');
  const parseError = xml.querySelector('parsererror');

  if (parseError) {
    throw new Error('XML invalido.');
  }

  const sections = [...xml.querySelectorAll('section')];
  if (!sections.length) {
    galleryRoot.innerHTML = '<p class="gallery-empty">Nenhuma secao encontrada no XML.</p>';
    return;
  }

  const html = sections
    .map((section) => {
      const sectionName = escapeHtml(section.getAttribute('name') || 'Sem nome');
      const items = [...section.querySelectorAll('item')];

      if (!items.length) {
        return `
          <article class="gallery-section">
            <h2>${sectionName}</h2>
            <p class="gallery-empty">Sem itens nesta secao.</p>
          </article>
        `;
      }

      const cards = items
        .map((item) => {
          const type = (item.getAttribute('type') || 'image').toLowerCase();
          const src = escapeHtml(item.getAttribute('src') || '');
          const title = escapeHtml(item.getAttribute('title') || 'Sem titulo');
          const caption = escapeHtml(item.getAttribute('caption') || '');
          const captionText = caption || '&nbsp;';

          const media =
            type === 'video'
              ? `<video class="gallery-media" controls preload="metadata"><source src="${src}" /></video>`
              : `<img class="gallery-media gallery-media-image" src="${src}" alt="${title}" loading="lazy" tabindex="0" role="button" aria-label="Ampliar foto" />`;

          return `
            <figure class="gallery-card">
              ${media}
              <figcaption class="gallery-caption">
                <span>${captionText}</span>
              </figcaption>
            </figure>
          `;
        })
        .join('');

      return `
        <article class="gallery-section">
          <h2>${sectionName}</h2>
          <div class="gallery-grid">${cards}</div>
        </article>
      `;
    })
    .join('');

  galleryRoot.innerHTML = `${html}<p class="editor-note">Conteudo carregado de galery/galeria.xml.</p>`;
}

async function loadGallery() {
  if (!galleryRoot) {
    return;
  }

  try {
    const response = await fetch('galery/galeria.xml', { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`Falha ao abrir XML (${response.status}).`);
    }

    const xmlText = await response.text();
    renderGallery(xmlText);
  } catch (error) {
    galleryRoot.innerHTML = `<p class="gallery-error">Nao foi possivel carregar a galeria: ${escapeHtml(error.message)}</p>`;
  }
}

if (galleryRoot) {
  galleryRoot.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    const image = target.closest('.gallery-media-image');
    if (!(image instanceof HTMLImageElement)) {
      return;
    }

    openGalleryModal(image.currentSrc || image.src, image.alt);
  });

  galleryRoot.addEventListener('keydown', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    const image = target.closest('.gallery-media-image');
    if (!(image instanceof HTMLImageElement)) {
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openGalleryModal(image.currentSrc || image.src, image.alt);
    }
  });
}

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closeGalleryModal();
  }
});

loadGallery();
