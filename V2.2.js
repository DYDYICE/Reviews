window.replies = window.replies || {};

(() => {

// =================== STATE ===================
let reviews = [];
const reviewList = document.getElementById("reviewList");

// =================== TOAST ===================
const toast = document.createElement("div");
toast.style.cssText =
  "position:fixed;top:20px;left:50%;transform:translateX(-50%);background:#2e7d32;color:#fff;padding:10px 16px;border-radius:8px;font-weight:600;display:none;z-index:9999;";
document.body.appendChild(toast);

function showToast(msg) {
  toast.textContent = msg;
  toast.style.display = "block";
  setTimeout(() => (toast.style.display = "none"), 1700);
}

// =================== LANGUAGE DETECTION ===================
function detectLanguage(text) {
  if (!text || text.trim().length <= 2) return "Other";
  const lower = text.toLowerCase();
  const FR = ["le", "la", "les", "un", "une", "et", "avec", "merci", "super", "magnifique", "accueil", "experience"];
  const NL = ["de", "het", "een", "met", "voor", "van", "op", "vriendelijk", "plezier", "gezellig", "bedankt"];
  const EN = ["the", "and", "is", "was", "with", "for", "thanks", "great", "amazing", "fun", "staff", "perfect"];
  const count = (arr) => arr.reduce((acc, w) => acc + (lower.includes(w) ? 1 : 0), 0);
  const fr = count(FR), nl = count(NL), en = count(EN);
  const max = Math.max(fr, nl, en);
  if (max === 0) return "Other";
  if (max === fr) return "FR";
  if (max === nl) return "NL";
  return "EN";
}

function mapParkToCategory(park, hasText) {
  if (!hasText) return "noText";
  const p = park.toLowerCase();
  if (p.includes("jungle")) return "Jungle";
  if (p.includes("skydiving")) return "Skydive";
  if (p.includes("restaurant")) return "Resto";
  if (p.includes("ice")) return "IMAP";
  return "IMAP";
}

// =================== RENDER ===================
function rerenderList() {
  reviewList.innerHTML = "";
  for (let i = reviews.length - 1; i >= 0; i--) {
    const r = reviews[i];
    const item = document.createElement("div");
    item.className = "review-item";
    item.innerHTML = `
      <div class="review-head" style="grid-template-columns: 50px 1fr 1fr 1fr 120px 80px;">
        <input class="star-input" type="number" min="1" max="5" value="${r.stars}" style="width:50px;" />
        <select class="platform-select" style="width:100px;">
          <option>Google</option><option>Tripadvisor</option><option>Facebook</option><option>Other</option>
        </select>
        <select class="language-select" style="width:90px;">
          <option>FR</option><option>NL</option><option>EN</option><option>Other</option>
        </select>
        <select class="park-select" style="width:180px;">
          <option>Ice Mountain Adventure Park</option>
          <option>Restaurant - Le Chalet Gourmand</option>
          <option>Restaurant - Le Buffet du Montagnard</option>
          <option>Indoor Skydiving</option>
          <option>Ice Mountain Outdoor</option>
          <option>Jungle City</option>
          <option>Restauration Jungle City</option>
          <option>Jungle Goolfy</option>
          <option>Jungle Expedition</option>
        </select>
        <button class="edit-btn">✏️ Edit</button>
        <button class="delete-btn">🗑 Delete</button>
      </div>
      <div class="review-text small">${r.text || "(no text)"}</div>
    `;

    // Bind edits
    item.querySelector(".star-input").addEventListener("change", (e) => {
      r.stars = Math.min(5, Math.max(1, parseInt(e.target.value || "1", 10)));
    });

    const platSel = item.querySelector(".platform-select");
    platSel.value = r.platform;
    platSel.addEventListener("change", (e) => (r.platform = e.target.value));

    const langSel = item.querySelector(".language-select");
    langSel.value = r.language;
    langSel.addEventListener("change", (e) => (r.language = e.target.value));

    const parkSel = item.querySelector(".park-select");
    parkSel.value = r.park;
    parkSel.addEventListener("change", (e) => (r.park = e.target.value));

    item.querySelector(".delete-btn").onclick = () => {
      reviews.splice(i, 1);
      rerenderList();
    };

    // Edit inline
    item.querySelector(".edit-btn").onclick = () => {
      const newText = prompt("Edit review text:", r.text || "");
      if (newText !== null) {
        r.text = newText.trim();
        item.querySelector(".review-text").textContent = r.text || "(no text)";
        const cat = mapParkToCategory(r.park, !!r.text);
        const reply =
          window.replies?.[r.language]?.[cat]?.[r.stars] ||
          window.replies?.EN?.noText?.[r.stars] ||
          "";
        if (reply && navigator.clipboard)
          navigator.clipboard
            .writeText(reply)
            .then(() => showToast("Review updated; reply copied."));
        else showToast("Review updated.");
      }
    };

    reviewList.appendChild(item);
  }
}

// =================== BUTTONS ===================
const addBtn = document.getElementById("addBtn");
const exportBtn = document.getElementById("exportBtn");
const exportExcelBtn = document.getElementById("exportExcelBtn");
const clearBtn = document.getElementById("clearBtn");
const toggleToolsBtn = document.getElementById("toggleToolsBtn");

// Add review
addBtn.addEventListener("click", () => {
  const el = document.getElementById("reviewText");
  let raw = (el && (el.value || el.textContent || el.innerText || "")).trim();
  const starsVal = document.getElementById("stars").value.trim();
  const platform = document.getElementById("platform").value;
  const langChoice = document.getElementById("language").value;
  const park = document.getElementById("park").value;
  const important = document.getElementById("important").checked;
  const fistbump = document.getElementById("fistbump").checked;
  const fistbumpName = document.getElementById("fistbumpName").value.trim();

  if (!starsVal) {
    alert("Please provide a star rating (1–5).");
    return;
  }

  const text = raw.trim();
  const stars = Math.min(5, Math.max(1, parseInt(starsVal, 10)));
  const language =
    langChoice === "Auto"
      ? text.length
        ? detectLanguage(text)
        : "Other"
      : langChoice;

  const review = {
    id: Math.random().toString(36).slice(2),
    park,
    text,
    stars,
    platform,
    language,
    important,
    fistbump,
    fistbumpName,
  };
  reviews.push(review);
  rerenderList();

  const cat = mapParkToCategory(park, !!text);
  const reply =
    window.replies?.[language]?.[cat]?.[stars] ||
    window.replies?.EN?.noText?.[stars] ||
    "";
  if (reply && navigator.clipboard)
    navigator.clipboard
      .writeText(reply)
      .then(() => showToast("Review added; reply copied."));
  else showToast("Review added.");

  // reset
  el.value = "";
  document.getElementById("stars").value = "";
  document.getElementById("platform").selectedIndex = 0;
  document.getElementById("language").selectedIndex = 0;
  document.getElementById("important").checked = false;
  document.getElementById("fistbump").checked = false;
  document.getElementById("fistbumpName").value = "";
});

// Tools toggle
toggleToolsBtn.addEventListener("click", () => {
  const box = document.getElementById("exportControls");
  if (box.style.display === "none") {
    box.style.display = "block";
    toggleToolsBtn.textContent = "Hide Tools";
  } else {
    box.style.display = "none";
    toggleToolsBtn.textContent = "Show Tools";
  }
});

// Export JSON
exportBtn.addEventListener("click", () => {
  if (!reviews.length) {
    alert("No reviews to export!");
    return;
  }
  const clean = reviews.map((r) => ({
    Park: r.park,
    Stars: r.stars,
    Platform: r.platform,
    Language: r.language,
    Text: r.text,
    Important: r.important ? "X" : "",
    Fistbump: r.fistbump ? "X" : "",
    FistbumpName: r.fistbumpName || "",
  }));
  const blob = new Blob([JSON.stringify(clean, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `reviews-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast("Exported to JSON.");
});

// Export Excel
exportExcelBtn.addEventListener("click", () => {
  if (!reviews.length) {
    alert("No reviews to export!");
    return;
  }
  const clean = reviews.map((r) => ({
    Park: r.park,
    Stars: r.stars,
    Platform: r.platform,
    Language: r.language,
    Text: r.text,
    Important: r.important ? "X" : "",
    Fistbump: r.fistbump ? "X" : "",
    FistbumpName: r.fistbumpName || "",
  }));
  const ws = XLSX.utils.json_to_sheet(clean);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Reviews");
  XLSX.writeFile(wb, `reviews-${new Date().toISOString().slice(0, 10)}.xlsx`);
  showToast("Exported to Excel.");
});

// Clear
clearBtn.addEventListener("click", () => {
  if (confirm("Clear all current reviews?")) {
    reviews = [];
    rerenderList();
    showToast("All reviews cleared.");
  }
});

// Scroll to QRG
const scrollBtn = document.getElementById("scrollToQRG");
scrollBtn.addEventListener("click", () => {
  const qrg = document.getElementById("qrgSection");
  if (qrg) qrg.scrollIntoView({ behavior: "smooth" });
});

})();
