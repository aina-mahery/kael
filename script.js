/*
  Livre photo anniversaire — JS vanilla amélioré
  Images attendues dans le même dossier :
  photo-1.jpg, photo-2.jpg, photo-3.jpg, photo-4.jpg,
  photo-5.jpg, photo-6.jpg, photo-7.jpg, photo-8.jpeg

  Les dimensions source sont utilisées pour ajuster l'affichage sans jamais les montrer à l'utilisateur.
*/

const memories = [
  { age: 1, src: 'photo-1.jpg', width: 1260, height: 1681, title: 'Année 1', caption: '1 an • Un nouveau chapitre commence.' },
  { age: 2, src: 'photo-2.jpg', width: 1920, height: 2560, title: 'Année 2', caption: '2 ans • Encore plus de rires et de découvertes.' },
  { age: 3, src: 'photo-3.JPG', width: 3078, height: 5472, title: 'Année 3', caption: '3 ans • Une énergie incroyable et des souvenirs précieux.' },
  { age: 4, src: 'photo-4.jpg', width: 3456, height: 4608, title: 'Année 4', caption: '4 ans • Des moments joyeux à collectionner.' },
  { age: 5, src: 'photo-5.jpg', width: 1536, height: 2048, title: 'Année 5', caption: '5 ans • Un sourire qui illumine tout autour de toi.' },
  { age: 6, src: 'photo-6.jpg', width: 3024, height: 4032, title: 'Année 6', caption: '6 ans • Une nouvelle année pleine d\'aventures.' },
  { age: 7, src: 'photo-7.jpg', width: 2448, height: 3264, title: 'Année 7', caption: '7 ans • Toujours plus de bonheur et de magie.' },
  { age: 8, src: 'photo-8.jpeg', width: 1153, height: 2048, title: 'Année 8', caption: '8 ans • Joyeux anniversaire Kaël, profite à fond de ta journée !' }
];

const book = document.getElementById('birthdayBook');
const coverPage = document.getElementById('coverPage');
const replayBtn = document.getElementById('replayBtn');
const photoSheet = document.getElementById('photoSheet');
const photoFrame = document.getElementById('photoFrame');
const photoCard = document.getElementById('photoCard');
const memoryImage = document.getElementById('memoryImage');
const ageBadge = document.getElementById('ageBadge');
const counterChip = document.getElementById('counterChip');
const memoryTitle = document.getElementById('memoryTitle');
const memoryCaption = document.getElementById('memoryCaption');
const timeline = document.getElementById('timeline');
const nextBtn = document.getElementById('nextBtn');
const prevBtn = document.getElementById('prevBtn');

let currentIndex = 0;
let isAnimating = false;
const imagePreloadCache = new Map();

function preloadImage(src) {
  if (imagePreloadCache.has(src)) return imagePreloadCache.get(src);
  const promise = new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = src;
  });
  imagePreloadCache.set(src, promise);
  return promise;
}

function openBook() {
  book.dataset.open = 'true';
}

function closeBook() {
  if (isAnimating) return;
  book.dataset.open = 'false';
}

function formatCounter(index) {
  return `${String(index + 1).padStart(2, '0')} / ${String(memories.length).padStart(2, '0')}`;
}

function setMediaRatio(item) {
  const ratio = `${item.width} / ${item.height}`;
  photoFrame.style.setProperty('--media-ratio', ratio);

  const imageRatio = item.width / item.height;
  const viewportIsMobile = window.matchMedia('(max-width: 640px)').matches;

  if (viewportIsMobile) {
    photoFrame.style.aspectRatio = '3 / 4';
  } else if (imageRatio < 0.72) {
    photoFrame.style.aspectRatio = '3 / 4.2';
  } else if (imageRatio < 1) {
    photoFrame.style.aspectRatio = '4 / 5';
  } else {
    photoFrame.style.aspectRatio = '16 / 10';
  }
}

function buildYearRail() {
  timeline.innerHTML = '';
  memories.forEach((item, index) => {
    const btn = document.createElement('button');
    btn.className = `year-dot${index === currentIndex ? ' is-active' : ''}`;
    btn.type = 'button';
    btn.setAttribute('aria-label', `Aller à ${item.age} an${item.age > 1 ? 's' : ''}`);
    btn.innerHTML = `
      <span class="year-dot__bullet" aria-hidden="true"></span>
      <span class="year-dot__text">${item.age} an${item.age > 1 ? 's' : ''}</span>
    `;
    btn.addEventListener('click', () => goTo(index));
    timeline.appendChild(btn);
  });
}

function getFallbackSvg(item) {
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 1600">
      <defs>
        <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
          <stop stop-color="#dbeafe" offset="0%"/>
          <stop stop-color="#dcfce7" offset="100%"/>
        </linearGradient>
      </defs>
      <rect width="1200" height="1600" fill="url(#g)"/>
      <circle cx="260" cy="250" r="120" fill="#93c5fd" opacity=".5"/>
      <circle cx="980" cy="360" r="170" fill="#86efac" opacity=".42"/>
      <rect x="170" y="280" width="860" height="1040" rx="42" fill="rgba(255,255,255,.76)" stroke="rgba(15,23,42,.08)"/>
      <text x="600" y="620" text-anchor="middle" font-family="Arial, sans-serif" font-size="120" font-weight="700" fill="#1d4ed8">${item.age} an${item.age > 1 ? 's' : ''}</text>
      <text x="600" y="770" text-anchor="middle" font-family="Arial, sans-serif" font-size="42" fill="#334155">Ajoute ${item.src} dans le dossier</text>
    </svg>
  `);
}

async function updateMemory(index) {
  const item = memories[index];
  ageBadge.textContent = `${item.age} an${item.age > 1 ? 's' : ''}`;
  counterChip.textContent = formatCounter(index);
  memoryTitle.textContent = item.title;
  memoryCaption.textContent = item.caption;
  memoryImage.alt = `Photo souvenir de Kaël à ${item.age} an${item.age > 1 ? 's' : ''}`;
  setMediaRatio(item);

  const loaded = await preloadImage(item.src);
  memoryImage.src = loaded ? item.src : getFallbackSvg(item);

  buildYearRail();
  preloadAdjacent(index);
}

function preloadAdjacent(index) {
  const next = memories[(index + 1) % memories.length];
  const prev = memories[(index - 1 + memories.length) % memories.length];
  preloadImage(next.src);
  preloadImage(prev.src);
}

function animateFlip(targetIndex) {
  if (isAnimating) return;
  isAnimating = true;
  photoSheet.classList.add('is-flipping');
  photoCard.setAttribute('aria-busy', 'true');

  window.setTimeout(() => {
    currentIndex = (targetIndex + memories.length) % memories.length;
    updateMemory(currentIndex);
  }, 420);

  window.setTimeout(() => {
    photoSheet.classList.remove('is-flipping');
    photoCard.removeAttribute('aria-busy');
    isAnimating = false;
  }, 980);
}

function nextMemory() {
  animateFlip(currentIndex + 1);
}

function previousMemory() {
  animateFlip(currentIndex - 1);
}

function goTo(index) {
  if (index === currentIndex || isAnimating) return;
  animateFlip(index);
}

function bindOpenEvents() {
  coverPage.addEventListener('click', openBook);
  coverPage.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openBook();
    }
  });
}

function bindNavigationEvents() {
  replayBtn.addEventListener('click', closeBook);
  nextBtn.addEventListener('click', nextMemory);
  prevBtn.addEventListener('click', previousMemory);
  photoSheet.addEventListener('click', nextMemory);
  photoSheet.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      nextMemory();
    }
  });

  let touchStartX = 0;
  let touchEndX = 0;

  photoSheet.addEventListener('touchstart', (event) => {
    touchStartX = event.changedTouches[0].clientX;
  }, { passive: true });

  photoSheet.addEventListener('touchend', (event) => {
    touchEndX = event.changedTouches[0].clientX;
    const delta = touchEndX - touchStartX;
    if (Math.abs(delta) < 36) return;
    if (delta < 0) nextMemory();
    if (delta > 0) previousMemory();
  }, { passive: true });

  document.addEventListener('keydown', (event) => {
    if (book.dataset.open !== 'true' || isAnimating) return;
    if (event.key === 'ArrowRight') nextMemory();
    if (event.key === 'ArrowLeft') previousMemory();
    if (event.key === 'Escape') closeBook();
  });
}

function bindResizeHandling() {
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => setMediaRatio(memories[currentIndex]), 90);
  });
}

function init() {
  bindOpenEvents();
  bindNavigationEvents();
  bindResizeHandling();
  updateMemory(currentIndex);
}

init();
