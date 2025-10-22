function waitForElement(selector, callback) {
  const el = document.querySelector(selector);
  if (el) callback();
  else setTimeout(() => waitForElement(selector, callback), 100);
}

waitForElement('#addBtn', () => {

  window.replies = window.replies || {};

  function isFormFieldFocused() {
    const ae = document.activeElement;
    if (!ae) return false;
    const tag = ae.tagName ? ae.tagName.toLowerCase() : '';
    return ['input','textarea','select'].includes(tag);
  }

  function detectLanguage(text) {
    if (!text || text.trim().length <= 2) return 'Other';
    const lower = text.toLowerCase();
    const FR = ['le','la','les','un','une','des','et','très','avec','super','parc','enfants','merci','génial','ravis'];
    const NL = ['de','het','een','en','heel','zeer','leuk','leuke','tof','kind','kindjes','park','attracties','vandaag','terug','vriendelijk','betaalbaar','mooi','prachtig','halloween'];
    const EN = ['the','and','is','was','with','great','amazing','kids','park','staff','friendly','helpful','price','mountain','thanks','thank'];
    const count = (arr) => arr.reduce((acc, w) => acc + (lower.includes(w) ? 1 : 0), 0);
    const fr = count(FR), nl = count(NL), en = count(EN);
    const max = Math.max(fr, nl, en);
    if (max === 0) return 'Other';
    if (max === fr) return 'FR';
    if (max === nl) return 'NL';
    return 'EN';
  }

  const reviews = [];
  const reviewList = document.getElementById('reviewList');
  const addBtn = document.getElementById('addBtn');
  const exportBtn = document.getElementById('exportBtn');
  const exportNotice = document.getElementById('exportNotice');

  function renderReview(idx) {
    const item = reviews[idx];
    const wrap = document.createElement('div');
    wrap.className = 'review-item';
    wrap.dataset.index = idx;

    const head = document.createElement('div');
    head.className = 'review-head';

    const stars = document.createElement('input');
    stars.type = 'number'; stars.min = 1; stars.max = 5; stars.value = item.stars;
    stars.addEventListener('change', () => item.stars = Math.min(5, Math.max(1, parseInt(stars.value || '0', 10))));

    const platform = document.createElement('select');
    ['Google','Tripadvisor','Facebook','Other'].forEach(p => {
      const opt = new Option(p, p, false, item.platform === p);
      platform.add(opt);
    });
    platform.addEventListener('change', () => item.platform = platform.value);

    const lang = document.createElement('select');
    ['FR','NL','EN','Other'].forEach(l => {
      const opt = new Option(l, l, false, item.language === l);
      lang.add(opt);
    });
    lang.addEventListener('change', () => item.language = lang.value);

    const del = document.createElement('button');
    del.textContent = 'Delete';
    del.className = 'delete-btn';
    del.addEventListener('click', () => {
      reviews.splice(idx, 1);
      wrap.remove();
    });

    head.append(stars, platform, lang, del);

    const textDiv = document.createElement('div');
    textDiv.className = 'review-text small';
    textDiv.textContent = item.text && item.text.trim() ? item.text : '(no text)';

    const meta = document.createElement('div');
    meta.className = 'small muted';
    meta.textContent = `Added: ${new Date(item.date).toLocaleString()}`;

    wrap.append(head, textDiv, meta);
    return wrap;
  }

  addBtn.addEventListener('click', () => {
    const text = document.getElementById('reviewText').value;
    const starsVal = document.getElementById('stars').value.trim();
    const platform = document.getElementById('platform').value;
    let langChoice = document.getElementById('language').value;

    if (!starsVal) {
      alert('Please provide a star rating (1–5).');
      return;
    }

    const stars = Math.min(5, Math.max(1, parseInt(starsVal, 10)));
    let language = 'Other';
    if (langChoice === 'Auto') language = detectLanguage(text);
    else language = langChoice;

    const review = { text: (text || '').trim(), stars, platform, language, date: new Date().toISOString() };
    reviews.push(review);
    reviewList.prepend(renderReview(reviews.length - 1));

    document.getElementById('reviewText').value = '';
    document.getElementById('stars').value = '';
    document.getElementById('platform').selectedIndex = 0;
    document.getElementById('language').selectedIndex = 0;
  });

  exportBtn.addEventListener('click', () => {
    if (reviews.length === 0) return alert('No reviews to export!');
    const blob = new Blob([JSON.stringify(reviews, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `reviews_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    reviews.length = 0;
    reviewList.innerHTML = '';
    exportNotice.style.display = 'block';
    setTimeout(() => exportNotice.style.display = 'none', 2000);
  });

  const copyBtn = document.getElementById('copyReplyBtn');
  const copiedMsg = document.getElementById('copied');

  copyBtn.addEventListener('click', async () => {
    const lang = document.getElementById('replyLang').value;
    const stars = document.getElementById('replyStars').value;
    const cat = document.getElementById('replyCategory').value;

    try {
      const text = replies?.[lang]?.[cat]?.[stars];
      if (!text) throw new Error('Reply not found.');
      await navigator.clipboard.writeText(text);
      copiedMsg.style.display = 'block';
      setTimeout(() => copiedMsg.style.display = 'none', 1500);
    } catch (err) {
      alert('Could not copy reply: ' + err.message);
    }
  });

  document.addEventListener('keydown', (e) => {
    if (isFormFieldFocused()) return;
    if (['1','2','3','4','5'].includes(e.key)) {
      document.getElementById('replyStars').value = e.key;
      document.getElementById('replyCategory').focus();
    }
  });

});
