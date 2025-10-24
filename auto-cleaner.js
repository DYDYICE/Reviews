// --- Park detection ---
function detectPark(raw) {
  const t = (raw || '').toLowerCase();
  if (t.includes('jungle expedition')) return 'Jungle Expedition';
  if (t.includes('jungle goolfy')) return 'Jungle Goolfy';
  if (t.includes('jungle city')) return 'Jungle City';
  if (t.includes('chalet gourmand') || t.includes('buffet du montagnard')) return 'Restaurant';
  if (t.includes('indoor skydiving')) return 'Indoor Skydiving';
  if (t.includes('ice mountain')) return 'Ice Mountain Adventure Park';
  return 'Other';
}

// --- Paste cleaner ---
function cleanPastedReview(raw) {
  const lines = raw.replace(/\r/g, '').split('\n').map(l => l.trim()).filter(Boolean);
  let textLines = [];
  let foundStars = false;
  for (const l of lines) {
    if (//.test(l)) { foundStars = true; continue; }
    if (!foundStars) continue;
    textLines.push(l);
  }
  let text = textLines.join('\n').trim();
  if (/l'utilisateur n'a pas rédigé/i.test(text)) text = '';
  return text;
}

// --- Run once the DOM is ready ---
document.addEventListener('DOMContentLoaded', () => {
  const reviewBox = document.getElementById('reviewText');
  const starsInput = document.getElementById('stars');
  const langEl = document.getElementById('language');
  const addBtn = document.getElementById('addBtn');

  if (!reviewBox) return;

  // Clean automatically when user pastes
  reviewBox.addEventListener('paste', () => {
    setTimeout(() => {
      const raw = reviewBox.value;
      const park = detectPark(raw);
      const text = cleanPastedReview(raw);

      reviewBox.value = text;
      reviewBox.dataset.park = park;
      langEl.value = text.trim().length ? 'Auto' : 'EN';
      starsInput.focus();
    }, 0);
  });

  // Extend add button to include park + EN fallback
  addBtn.addEventListener('click', () => {
    const park = reviewBox.dataset.park || 'Other';
    const text = reviewBox.value.trim();
    const starsVal = starsInput.value.trim();
    const platform = document.getElementById('platform').value;
    const langChoice = langEl.value;

    if (!starsVal) {
      alert('Please provide a star rating (1–5).');
      return;
    }
    const stars = Math.min(5, Math.max(1, parseInt(starsVal, 10)));

    let language = 'EN';
    if (text.length && langChoice === 'Auto') language = detectLanguage(text);

    const review = { 
      id: Math.random().toString(36).slice(2),
      text,
      stars,
      platform,
      language,
      park,
      date: new Date().toISOString()
    };

    if (window.reviews) {
      window.reviews.push(review);
      if (typeof rerenderList === 'function') rerenderList();
    }

    reviewBox.value = '';
    reviewBox.dataset.park = '';
    starsInput.value = '';
    document.getElementById('platform').selectedIndex = 0;
    langEl.selectedIndex = 0;
  });
});
