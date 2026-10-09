const welcomeModal = document.querySelector('#welcome-modal');

if (welcomeModal) {
  welcomeModal.querySelectorAll('.welcome-modal-close, [data-dismiss-welcome]').forEach((button) => {
    button.addEventListener('click', () => welcomeModal.close());
  });

  welcomeModal.addEventListener('close', () => {
    document.documentElement.classList.remove('welcome-modal-open');
  });

  welcomeModal.showModal();
  document.documentElement.classList.add('welcome-modal-open');
}

const menuToggle = document.querySelector('.menu-toggle');
const siteNav = document.querySelector('#site-nav');

if (menuToggle && siteNav) {
  menuToggle.addEventListener('click', () => {
    const expanded = menuToggle.getAttribute('aria-expanded') === 'true';
    menuToggle.setAttribute('aria-expanded', String(!expanded));
    siteNav.classList.toggle('is-open');
  });

  siteNav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      siteNav.classList.remove('is-open');
      menuToggle.setAttribute('aria-expanded', 'false');
    });
  });
}

const revealElements = document.querySelectorAll('.reveal');

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.18 }
);

revealElements.forEach((element) => observer.observe(element));
