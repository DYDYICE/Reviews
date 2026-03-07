window.replies = window.replies || {};

(() => {
  // =================== CONFIG ===================
  const parkOptions = [
    "Ice Mountain Adventure Park",
    "Indoor Skydiving",
    "Ice Mountain Outdoor",
    "Restaurant - Le Chalet Gourmand",
    "Restaurant - Le Buffet du Montagnard",
    "Jungle City",
    "Restauration Jungle City",
    "Jungle Goolfy",
    "Jungle Expedition"
  ];

  const PLATFORM_STORAGE_KEY = "reviewCollectorPlatform";

  // =================== INIT ===================
  const parkSelect = document.getElementById("park");
  const platformSelect = document.getElementById("platform");
  const reviewDateInput = document.getElementById("reviewDate");
  const reviewStats = document.getElementById("reviewStats");

  parkOptions.forEach(p => {
    const opt = document.createElement("option");
    opt.textContent = p;
    parkSelect.appendChild(opt);
  });

  // Keep only latest chosen platform
  const savedPlatform = localStorage.getItem(PLATFORM_STORAGE_KEY);
  if (savedPlatform) {
    platformSelect.value = savedPlatform;
  }

  platformSelect.addEventListener("change", () => {
    localStorage.setItem(PLATFORM_STORAGE_KEY, platformSelect.value);
  });

  // Default date = today
  if (reviewDateInput && !reviewDateInput.value) {
    reviewDateInput.value = new Date().toISOString().slice(0, 10);
  }

  const fistbumpInput = document.getElementById("fistbumpName");
  const fistbumpCheckbox = document.getElementById("fistbump");

  if (fistbumpInput) {
    fistbumpInput.style.width = "100%";
    fistbumpInput.style.boxSizing = "border-box";
    fistbumpInput.style.transition = "opacity 0.2s ease";
    fistbumpInput.style.opacity = "0";
    fistbumpInput.style.display = "none";
  }

  if (fistbumpCheckbox && fistbumpInput) {
    fistbumpCheckbox.addEventListener("change", e => {
      if (e.target.checked) {
        fistbumpInput.style.display = "block";
        setTimeout(() => {
          fistbumpInput.style.opacity = "1";
        }, 10);
      } else {
        fistbumpInput.style.opacity = "0";
        setTimeout(() => {
          fistbumpInput.style.display = "none";
        }, 200);
        fistbumpInput.value = "";
      }
    });
  }

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
    setTimeout(() => {
      toast.style.display = "none";
    }, 1700);
  }

  // =================== LANGUAGE DETECTION ===================
  function detectLanguage(text) {
    if (!text || text.trim().length <= 2) return "Other";

    const lower = ` ${text.toLowerCase()} `;

    const FR = [
      " le ", " la ", " les ", " un ", " une ", " des ", " et ", " avec ", " pour ",
      " merci ", " accueil ", " superbe ", " magnifique ", " expérience ", " c'était ",
      " nous ", " très ", " endroit ", " enfants "
    ];

    const NL = [
      " de ", " het ", " een ", " met ", " voor ", " van ", " op ", " vriendelijk ",
      " gezellig ", " bedankt ", " heel ", " was ", " super ", " kinderen ", " leuke "
    ];

    const EN = [
      " the ", " and ", " is ", " was ", " with ", " for ", " thanks ", " great ",
      " amazing ", " fun ", " staff ", " perfect ", " kids ", " place ", " very "
    ];

    const countMatches = arr => arr.reduce((acc, word) => acc + (lower.includes(word) ? 1 : 0), 0);

    const fr = countMatches(FR);
    const nl = countMatches(NL);
    const en = countMatches(EN);

    const max = Math.max(fr, nl, en);
    if (max === 0) return "Other";

    const winners = [
      fr === max ? "FR" : null,
      nl === max ? "NL" : null,
      en === max ? "EN" : null
    ].filter(Boolean);

    if (winners.length !== 1) return "Other";
    return winners[0];
  }

  // =================== STATS ===================
  function renderStats() {
    if (!reviewStats) return;

    if (!reviews.length) {
      reviewStats.innerHTML = "<strong>Stats:</strong> 0 reviews";
      return;
    }

    const total = reviews.length;
    const avgStars = (reviews.reduce((sum, r) => sum + r.stars, 0) / total).toFixed(1);

    const byPlatform = reviews.reduce((acc, r) => {
      acc[r.platform] = (acc[r.platform] || 0) + 1;
      return acc;
    }, {});

    const importantCount = reviews.filter(r => r.important).length;
    const mentionCount = reviews.filter(r => r.fistbump).length;

    const platformText = Object.entries(byPlatform)
      .map(([platform, count]) => `${platform}: ${count}`)
      .join(" | ");

    reviewStats.innerHTML = `
      <strong>Stats:</strong> ${total} reviews | Avg stars: ${avgStars} | ${platformText} | Important: ${importantCount} | Special mention: ${mentionCount}
    `;
  }

  // =================== RENDER ===================
  function rerenderList() {
    reviewList.innerHTML = "";

    for (let i = reviews.length - 1; i >= 0; i--) {
      const r = reviews[i];
      const item = document.createElement("div");
      item.className = "review-item";

      item.innerHTML = `
        <div class="review-head">
          <input class="star-input" type="number" min="1" max="5" value="${r.stars}" />
          <select class="platform-select">
            <option>Google</option>
            <option>Tripadvisor</option>
            <option>Facebook</option>
            <option>Other</option>
          </select>
          <select class="language-select">
            <option>FR</option>
            <option>NL</option>
            <option>EN</option>
            <option>Other</option>
          </select>
          <select class="park-select"></select>
          <button class="edit-btn">✏️ Edit</button>
          <button class="delete-btn">🗑 Delete</button>
        </div>

        <div class="review-meta">
          <span><strong>Date:</strong> ${r.date || "-"}</span>
          <span><strong>Important:</strong> ${r.important ? "Yes" : "No"}</span>
          <span><strong>Special mention:</strong> ${r.fistbump ? "Yes" : "No"}</span>
          ${r.fistbumpName ? `<span><strong>Name:</strong> ${r.fistbumpName}</span>` : ""}
        </div>

        <div class="review-text small">${r.text || "(no text)"}</div>
      `;

      const parkSel = item.querySelector(".park-select");
      parkOptions.forEach(p => {
        const o = document.createElement("option");
        o.textContent = p;
        parkSel.appendChild(o);
      });
      parkSel.value = r.park;

      item.querySelector(".star-input").addEventListener("change", e => {
        r.stars = Math.min(5, Math.max(1, parseInt(e.target.value || "1", 10)));
        renderStats();
      });

      const platSel = item.querySelector(".platform-select");
      platSel.value = r.platform;
      platSel.addEventListener("change", e => {
        r.platform = e.target.value;
        renderStats();
      });

      const langSel = item.querySelector(".language-select");
      langSel.value = r.language;
      langSel.addEventListener("change", e => {
        r.language = e.target.value;
      });

      parkSel.addEventListener("change", e => {
        r.park = e.target.value;
      });

      item.querySelector(".delete-btn").onclick = () => {
        reviews.splice(i, 1);
        rerenderList();
      };

      item.querySelector(".edit-btn").onclick = () => {
        const newText = prompt("Edit review text:", r.text || "");
        if (newText !== null) {
          r.text = newText.trim();
          rerenderList();
          showToast("Review updated.");
        }
      };

      reviewList.appendChild(item);
    }

    renderStats();
  }

  // =================== BUTTONS ===================
  const addBtn = document.getElementById("addBtn");
  const exportBtn = document.getElementById("exportBtn");
  const exportExcelBtn = document.getElementById("exportExcelBtn");
  const clearBtn = document.getElementById("clearBtn");
  const toggleToolsBtn = document.getElementById("toggleToolsBtn");

  addBtn.addEventListener("click", () => {
    const reviewTextEl = document.getElementById("reviewText");
    const date = document.getElementById("reviewDate").value;
    const starsVal = document.getElementById("stars").value.trim();
    const platform = document.getElementById("platform").value;
    const langChoice = document.getElementById("language").value;
    const park = document.getElementById("park").value;
    const important = document.getElementById("important").checked;
    const fistbump = document.getElementById("fistbump").checked;
    const fistbumpName = fistbumpInput ? fistbumpInput.value.trim() : "";

    const raw = (reviewTextEl && (reviewTextEl.value || reviewTextEl.textContent || reviewTextEl.innerText || "")).trim();

    if (!starsVal) {
      alert("Please provide a star rating (1–5).");
      return;
    }

    const text = raw.trim();
    const stars = Math.min(5, Math.max(1, parseInt(starsVal, 10)));
    const language = (langChoice === "Auto")
      ? (text.length ? detectLanguage(text) : "Other")
      : langChoice;

    const review = {
      id: Math.random().toString(36).slice(2),
      date,
      park,
      text,
      stars,
      platform,
      language,
      important,
      fistbump,
      fistbumpName
    };

    reviews.push(review);
    rerenderList();
    showToast("Review added.");

    reviewTextEl.value = "";
    document.getElementById("stars").value = "";
    document.getElementById("language").selectedIndex = 0;
    document.getElementById("important").checked = false;
    document.getElementById("fistbump").checked = false;

    if (fistbumpInput) {
      fistbumpInput.value = "";
      fistbumpInput.style.opacity = "0";
      setTimeout(() => {
        fistbumpInput.style.display = "none";
      }, 200);
    }

    // keep platform as requested
    localStorage.setItem(PLATFORM_STORAGE_KEY, platform);

    // reset date to today for quick batch entry
    if (reviewDateInput) {
      reviewDateInput.value = new Date().toISOString().slice(0, 10);
    }
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

    const clean = reviews.map(r => ({
      Date: r.date || "",
      Park: r.park,
      Stars: r.stars,
      Platform: r.platform,
      Language: r.language,
      Text: r.text,
      Important: r.important ? "X" : "",
      SpecialMention: r.fistbump ? "X" : "",
      SpecialMentionName: r.fistbumpName || ""
    }));

    const blob = new Blob([JSON.stringify(clean, null, 2)], { type: "application/json" });
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

    const clean = reviews.map(r => ({
      Date: r.date || "",
      Park: r.park,
      Stars: r.stars,
      Platform: r.platform,
      Language: r.language,
      Text: r.text,
      Important: r.important ? "X" : "",
      SpecialMention: r.fistbump ? "X" : "",
      SpecialMentionName: r.fistbumpName || ""
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

  // Allow Enter to toggle checkboxes
  ["important", "fistbump"].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener("keydown", e => {
        if (e.key === "Enter") {
          e.preventDefault();
          el.checked = !el.checked;
          el.dispatchEvent(new Event("change"));
        }
      });
    }
  });

  renderStats();
})();
