document.addEventListener("DOMContentLoaded", () => {
  //  CONFIG
  const API_URL = "http://127.0.0.1:5000/predict";
  const WEATHER_API_KEY = "e44b3cd5d30bcf676f451ed39e74c48b";
  let CITY = "Ahmedabad";
  const HISTORY_KEY = "crop_field_history";

  //  CROP IMAGE PATHS (ALL 22 CROPS)
  const cropImages = {
    rice: "assets/rice_crop.png",
    maize: "assets/maize_crop.png",
    chickpea: "assets/chickpea_crop.png",
    kidneybeans: "assets/kidneybeans_crop.png",
    pigeonpeas: "assets/pigeonpeas_crop.png",
    mothbeans: "assets/mothbeans_crop.png",
    mungbean: "assets/mungbean_crop.png",
    blackgram: "assets/blackgram_crop.png",
    lentil: "assets/lentil_crop.png",
    pomegranate: "assets/pomegranate_crop.png",
    banana: "assets/banana_crop.png",
    mango: "assets/mango_crop.png",
    grapes: "assets/grapes_crop.png",
    watermelon: "assets/watermelon_crop.png",
    muskmelon: "assets/muskmelon_crop.png",
    apple: "assets/apple_crop.png",
    orange: "assets/orange_crop.png",
    papaya: "assets/papaya_crop.png",
    coconut: "assets/coconut_crop.png",
    cotton: "assets/cotton_crop.png",
    jute: "assets/jute_crop.png",
    coffee: "assets/coffee_crop.png",
  };

  function getCropImagePath(cropName) {
    const key = cropName.toLowerCase().trim().replace(/\s+/g, "");
    return cropImages[key] || "assets/default_crop.png";
  }

  //  NAVIGATION
  const navItems = document.querySelectorAll(
    ".sidebar-nav .nav-item[data-target]",
  );
  const views = document.querySelectorAll(".dashboard-view");
  const pageTitle = document.getElementById("page-title");

  navItems.forEach((item) => {
    item.addEventListener("click", (e) => {
      e.preventDefault();
      navItems.forEach((nav) => nav.classList.remove("active"));
      item.classList.add("active");

      const spanEl = item.querySelector("span");
      if (pageTitle && spanEl) pageTitle.innerText = spanEl.innerText;

      views.forEach((view) => {
        view.style.display = "none";
        view.classList.remove("active");
      });

      const targetId = item.getAttribute("data-target");
      const targetView = document.getElementById(targetId);
      if (targetView) {
        targetView.style.display = "block";
        setTimeout(() => targetView.classList.add("active"), 10);
      }

      // Refresh history table when tab is clicked
      if (targetId === "history-view") renderHistoryTable();
    });
  });

  //  FIELD HISTORY — localStorage
  function getHistory() {
    return JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
  }

  function saveToHistory(entry) {
    const history = getHistory();
    history.unshift(entry); // newest first
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  }

  function deleteFromHistory(id) {
    const history = getHistory().filter((h) => h.id !== id);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    renderHistoryTable();
  }

  function renderHistoryTable() {
    const tbody = document.querySelector("#history-table tbody");
    if (!tbody) return;

    const history = getHistory();

    if (history.length === 0) {
      tbody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align:center;padding:32px;color:var(--text-muted);">
                        <i class="ph ph-clock-counter-clockwise" style="font-size:32px;display:block;margin-bottom:8px;"></i>
                        No predictions saved yet. Use Crop Predictor and click "Save to History".
                    </td>
                </tr>`;
      return;
    }

    tbody.innerHTML = history
      .map(
        (h) => `
            <tr>
                <td>${h.date}</td>
                <td>${h.fieldName}</td>
                <td>${h.npk}</td>
                <td>${h.ph}</td>
                <td>${h.climate}</td>
                <td><strong class="text-primary">${h.crop}</strong></td>
                <td>${h.confidence}%</td>
                <td>
                    <button onclick="deleteHistory('${h.id}')"
                        style="background:none;border:none;cursor:pointer;color:#EF4444;">
                        <i class="ph ph-trash" style="font-size:18px;"></i>
                    </button>
                </td>
            </tr>
        `,
      )
      .join("");
  }

  // Expose delete function globally for inline onclick
  window.deleteHistory = function (id) {
    if (confirm("Delete this record?")) deleteFromHistory(id);
  };

  //  OVERVIEW — update total predictions count
  function updateOverviewCount() {
    const countEl = document.querySelector(".widget-info .value");
    if (countEl) {
      const history = getHistory();
      countEl.innerText = history.length;
    }
  }
  //  CROP DESCRIPTIONS
  const cropDescriptions = {
    rice: "Rice is ideal for your conditions due to high humidity, sufficient rainfall, and suitable nitrogen levels in the soil.",
    maize:
      "Maize suits your field due to moderate nitrogen, good drainage, and the current temperature range.",
    chickpea:
      "Chickpea is recommended for its compatibility with the low humidity and well-drained soil profile detected.",
    kidneybeans:
      "Kidney beans thrive in your warm temperature and moderate rainfall conditions.",
    pigeonpeas:
      "Pigeon peas are well-suited for the detected drought-prone, low-rainfall environment.",
    mothbeans:
      "Moth beans are ideal — highly drought-resistant and match your dry soil conditions.",
    mungbean:
      "Mung bean grows well in light sandy soil with the current pH and drainage levels.",
    blackgram:
      "Black gram suits the warm, humid conditions and the soil pH detected in your field.",
    lentil:
      "Lentils match the cool, dry weather and sandy loam soil composition of your field.",
    pomegranate:
      "Pomegranate suits the hot, dry climate and well-drained soil indicated by your inputs.",
    banana:
      "Banana is recommended due to high humidity, warm temperature, and rich soil nutrient levels.",
    mango:
      "Mango trees match the tropical climate and distinct dry season indicated by your data.",
    grapes:
      "Grapes are ideal for the low humidity and well-drained sandy-loam soil of your field.",
    watermelon:
      "Watermelon suits the sandy soil, warm temperature, and moderate rainfall in your field.",
    muskmelon:
      "Musk melon is a great fit for the warm, well-drained sandy soil conditions detected.",
    apple:
      "Apple suits the cold winter and mild summer climate pattern of your location.",
    orange:
      "Orange thrives in your subtropical climate with the detected moderate humidity levels.",
    papaya:
      "Papaya matches the warm temperature, high humidity, and well-drained soil in your field.",
    coconut:
      "Coconut is ideal for the high rainfall and warm coastal climate your data suggests.",
    cotton:
      "Cotton is recommended due to the deep, well-drained black soil and temperature range.",
    jute: "Jute is well-suited for the warm, humid climate and heavy rainfall detected.",
    coffee:
      "Coffee matches the tropical highland climate and mild temperatures in your field.",
  };

  function getCropDescription(crop) {
    return (
      cropDescriptions[crop.toLowerCase().trim()] ||
      `${crop} is highly suitable for the given soil and weather conditions based on your inputs.`
    );
  }

  //  DISPLAY RESULT
  const emptyState = document.getElementById("empty-state");
  const loadingState = document.getElementById("loading-state");
  const resultContent = document.getElementById("result-content");

  // Store last prediction for saving to history
  let lastPrediction = null;

  function displayResult(crop, confidence, inputs) {
    if (!resultContent) return;

    const cropNameEl = resultContent.querySelector(".crop-name");
    if (cropNameEl) cropNameEl.innerText = crop;

    const percentageEl = resultContent.querySelector(".percentage");
    if (percentageEl) percentageEl.innerText = `${confidence}%`;

    const circleEl = resultContent.querySelector(".circle");
    if (circleEl) {
      circleEl.setAttribute("stroke-dasharray", `${confidence}, 100`);
      circleEl.style.animation = "none";
      circleEl.offsetHeight;
      circleEl.style.animation = null;
    }

    const descEl = resultContent.querySelector(".why-crop p");
    if (descEl) descEl.innerText = getCropDescription(crop);

    const whyTitleEl = resultContent.querySelector(".why-crop h4");
    if (whyTitleEl)
      whyTitleEl.innerHTML = `<i class="ph-fill ph-check-circle"></i> Why ${crop}?`;

    const imgEl = resultContent.querySelector(".crop-image img");
    if (imgEl) {
      imgEl.src = getCropImagePath(crop);
      imgEl.alt = `${crop} Crop`;
      imgEl.onerror = function () {
        this.onerror = null;
        this.src = "assets/default_crop.png";
      };
    }

    if (loadingState) loadingState.style.display = "none";
    if (resultContent) resultContent.style.display = "block";

    // Store for save to history
    lastPrediction = { crop, confidence, inputs };

    document.dispatchEvent(
      new CustomEvent("cropPredicted", { detail: { crop } }),
    );
    updateOverviewCount();
  }

  function showError(msg) {
    if (loadingState) loadingState.style.display = "none";
    if (emptyState) {
      emptyState.style.display = "flex";
      emptyState.innerHTML = `
                <i class="ph ph-warning-circle" style="font-size:48px;color:#EF4444;margin-bottom:12px;"></i>
                <p style="color:#EF4444;font-weight:600;margin-bottom:6px;">${msg}</p>
                <p style="font-size:13px;color:var(--text-muted);">Make sure <code>python api.py</code> is running.</p>`;
    }
  }

  //  FORM SUBMIT → FLASK API
  const form = document.getElementById("prediction-form");

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      let isValid = true;
      form.querySelectorAll("input[required]").forEach((input) => {
        if (!input.value.trim()) {
          isValid = false;
          input.style.borderColor = "#EF4444";
        } else input.style.borderColor = "";
      });
      if (!isValid) {
        alert("Please fill in all required fields.");
        return;
      }

      const inputs = {
        N: parseFloat(document.getElementById("nitrogen").value),
        P: parseFloat(document.getElementById("phosphorus").value),
        K: parseFloat(document.getElementById("potassium").value),
        temperature: parseFloat(document.getElementById("temperature").value),
        humidity: parseFloat(document.getElementById("humidity").value),
        ph: parseFloat(document.getElementById("ph").value),
        rainfall: parseFloat(document.getElementById("rainfall").value),
      };

      if (emptyState) emptyState.style.display = "none";
      if (resultContent) resultContent.style.display = "none";
      if (loadingState) loadingState.style.display = "flex";

      try {
        const response = await fetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(inputs),
        });
        if (!response.ok) throw new Error(`Server error: ${response.status}`);
        const data = await response.json();
        const crop = data.crop.charAt(0).toUpperCase() + data.crop.slice(1);
        const confidence = Math.round(data.confidence);
        displayResult(crop, confidence, inputs);
      } catch (err) {
        console.error("Prediction error:", err);
        showError("Could not connect to the prediction API.");
      }
    });

    // New Prediction
    const newPredictionBtn = document.getElementById("new-prediction-btn");
    if (newPredictionBtn) {
      newPredictionBtn.addEventListener("click", () => {
        form.reset();
        lastPrediction = null;
        if (resultContent) resultContent.style.display = "none";
        if (emptyState) {
          emptyState.style.display = "flex";
          emptyState.innerHTML = `
                        <i class="ph ph-plant"></i>
                        <p>Fill the details and click "Recommend Crop" to see the prediction here.</p>`;
        }
      });
    }

    // Save to History
    const saveHistoryBtn = document.getElementById("save-history-btn");
    if (saveHistoryBtn) {
      saveHistoryBtn.addEventListener("click", () => {
        if (!lastPrediction) {
          alert("No prediction to save yet.");
          return;
        }

        const { crop, confidence, inputs } = lastPrediction;
        const now = new Date();

        const entry = {
          id: Date.now().toString(),
          date: now.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
          }),
          fieldName: `Field ${getHistory().length + 1}`,
          npk: `${inputs.N}-${inputs.P}-${inputs.K}`,
          ph: inputs.ph,
          climate: `${inputs.temperature}°C / ${inputs.humidity}% / ${inputs.rainfall}mm`,
          crop: crop,
          confidence: confidence,
        };

        saveToHistory(entry);
        updateOverviewCount();
        alert(`✅ "${crop}" prediction saved to Field History!`);
      });
    }

    // Download Report
    const downloadReportBtn = document.getElementById("download-report-btn");
    if (downloadReportBtn) {
      downloadReportBtn.addEventListener("click", () => window.print());
    }
  }

  //  HISTORY SEARCH
  const searchInput = document.getElementById("history-search-input");
  if (searchInput) {
    searchInput.addEventListener("keyup", function () {
      const filter = this.value.toLowerCase();
      const rows = document.querySelectorAll("#history-table tbody tr");
      rows.forEach((row) => {
        row.style.display = row.innerText.toLowerCase().includes(filter)
          ? ""
          : "none";
      });
    });
  }

  //  WEATHER — OpenWeatherMap + Open-Meteo fallback
  // Detect user's current city automatically

  async function detectUserCity() {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        console.warn("Geolocation is not supported.");
        resolve(CITY);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;

            const url = `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${WEATHER_API_KEY}`;

            const response = await fetch(url);
            const data = await response.json();

            if (data && data.length > 0 && data[0].name) {
              CITY = data[0].name;
              console.log("Detected city:", CITY);
            }
          } catch (error) {
            console.warn("City detection failed:", error);
          }

          resolve(CITY);
        },
        () => {
          console.warn("Location permission denied. Using default city.");
          resolve(CITY);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
        },
      );
    });
  }
  async function fetchWeatherData() {
    try {
      const WEATHER_URL = `https://api.openweathermap.org/data/2.5/weather?q=${CITY}&appid=${WEATHER_API_KEY}&units=metric`;
      const FORECAST_URL = `https://api.openweathermap.org/data/2.5/forecast?q=${CITY}&appid=${WEATHER_API_KEY}&units=metric&cnt=24`;

      const [curRes, foreRes] = await Promise.all([
        fetch(WEATHER_URL),
        fetch(FORECAST_URL),
      ]);
      if (!curRes.ok) throw new Error(`Weather API error: ${curRes.status}`);

      const cur = await curRes.json();
      const fore = await foreRes.json();

      const dateEl = document.getElementById("weather-date");
      if (dateEl)
        dateEl.innerText = new Date().toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        });

      const tempEl = document.getElementById("weather-temp");
      if (tempEl) tempEl.innerText = `${Math.round(cur.main.temp)}°C`;

      const humEl = document.getElementById("weather-humidity");
      if (humEl) humEl.innerText = `${cur.main.humidity}%`;

      const windEl = document.getElementById("weather-wind");
      if (windEl) windEl.innerText = `${Math.round(cur.wind.speed * 3.6)} km/h`;

      const rainEl = document.getElementById("weather-rain");
      if (rainEl)
        rainEl.innerText = cur.rain ? `${cur.rain["1h"] || 0} mm` : "0 mm";

      const code = cur.weather[0].main.toLowerCase();
      let iconClass = "ph-sun";
      if (code.includes("cloud")) iconClass = "ph-cloud-sun";
      if (code.includes("rain")) iconClass = "ph-cloud-rain";
      if (code.includes("drizzle")) iconClass = "ph-cloud-rain";
      if (code.includes("thunderstorm")) iconClass = "ph-cloud-lightning";
      if (code.includes("snow")) iconClass = "ph-snowflake";
      if (
        code.includes("mist") ||
        code.includes("fog") ||
        code.includes("haze")
      )
        iconClass = "ph-cloud-fog";
      if (code.includes("clear")) iconClass = "ph-sun";

      const descEl = document.getElementById("weather-desc");
      if (descEl)
        descEl.innerText =
          cur.weather[0].description.charAt(0).toUpperCase() +
          cur.weather[0].description.slice(1);

      const iconEl = document.getElementById("weather-icon");
      if (iconEl) iconEl.innerHTML = `<i class="ph-fill ${iconClass}"></i>`;

      // Auto-fill form
      const humInput = document.getElementById("humidity");
      const tempInput = document.getElementById("temperature");
      if (humInput && !humInput.value) humInput.value = cur.main.humidity;
      if (tempInput && !tempInput.value)
        tempInput.value = Math.round(cur.main.temp);

      // Forecast
      const days = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ];

      const today = new Date().getDate(); // Today's day of month
      const addedDays = new Set();
      let cardIndex = 1;
      for (const slot of fore.list) {
        const slotDate = new Date(slot.dt * 1000);
        if (slotDate.getDate() === today) {
          continue;
        }
        const dayNumber = slotDate.getDay();
        const dateKey = slotDate.toDateString(); // Unique full date
        if (addedDays.has(dateKey)) {
          continue;
        }
        addedDays.add(dateKey);
        if (cardIndex > 3) {
          break;
        }
        const fCode = slot.weather[0].main.toLowerCase();
        let fIcon = "ph-sun";
        if (fCode.includes("cloud")) fIcon = "ph-cloud-sun";
        if (fCode.includes("rain") || fCode.includes("drizzle"))
          fIcon = "ph-cloud-rain";
        if (fCode.includes("thunderstorm")) fIcon = "ph-cloud-lightning";
        if (fCode.includes("snow")) fIcon = "ph-snowflake";
        const dayEl = document.getElementById(`forecast-day-${cardIndex}`);
        const icoEl = document.getElementById(`forecast-icon-${cardIndex}`);
        const tmpEl = document.getElementById(`forecast-temp-${cardIndex}`);
        if (dayEl) {
          dayEl.innerText = cardIndex === 1 ? "Tomorrow" : days[dayNumber];
        }
        if (icoEl) {
          icoEl.className = `ph-fill ${fIcon}`;
        }
        if (tmpEl) {
          tmpEl.innerText = `${Math.round(slot.main.temp)}°`;
        }
        cardIndex++;
      }
    } catch (err) {
      console.warn(
        "OpenWeatherMap failed, switching to fallback:",
        err.message,
      );
      fetchWeatherFallback();
    }
  }

  async function fetchWeatherFallback() {
    try {
      const lat = 23.0225,
        lon = 72.5714;
      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
          `&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m,is_day` +
          `&daily=weather_code,temperature_2m_max&timezone=auto`,
      );
      if (!res.ok) throw new Error("Open-Meteo failed");
      const { current, daily } = await res.json();

      const dateEl = document.getElementById("weather-date");
      if (dateEl)
        dateEl.innerText = new Date().toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        });

      const tempEl = document.getElementById("weather-temp");
      if (tempEl) tempEl.innerText = `${Math.round(current.temperature_2m)}°C`;

      const humEl = document.getElementById("weather-humidity");
      if (humEl) humEl.innerText = `${current.relative_humidity_2m}%`;

      const windEl = document.getElementById("weather-wind");
      if (windEl) windEl.innerText = `${current.wind_speed_10m} km/h`;

      const rainEl = document.getElementById("weather-rain");
      if (rainEl) rainEl.innerText = `${current.precipitation} mm`;

      const code = current.weather_code;
      let desc = "Clear",
        iconClass = "ph-sun";
      if (code === 0) {
        desc = "Clear sky";
        iconClass = current.is_day ? "ph-sun" : "ph-moon";
      } else if (code <= 3) {
        desc = "Partly cloudy";
        iconClass = "ph-cloud-sun";
      } else if (code <= 48) {
        desc = "Fog";
        iconClass = "ph-cloud-fog";
      } else if (code <= 67) {
        desc = "Rain";
        iconClass = "ph-cloud-rain";
      } else if (code <= 77) {
        desc = "Snow";
        iconClass = "ph-snowflake";
      } else if (code <= 82) {
        desc = "Rain showers";
        iconClass = "ph-cloud-rain";
      } else if (code >= 95) {
        desc = "Thunderstorm";
        iconClass = "ph-cloud-lightning";
      }

      const descEl = document.getElementById("weather-desc");
      if (descEl) descEl.innerText = desc;

      const iconEl = document.getElementById("weather-icon");
      if (iconEl) iconEl.innerHTML = `<i class="ph-fill ${iconClass}"></i>`;

      const humInput = document.getElementById("humidity");
      const tempInput = document.getElementById("temperature");
      if (humInput && !humInput.value)
        humInput.value = current.relative_humidity_2m;
      if (tempInput && !tempInput.value)
        tempInput.value = Math.round(current.temperature_2m);

      const days = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ];
      for (let i = 1; i <= 3; i++) {
        const d = new Date(daily.time[i]);
        const fCode = daily.weather_code[i];
        let fIcon = "ph-sun";
        if (fCode > 0 && fCode <= 3) fIcon = "ph-cloud-sun";
        if (fCode > 3) fIcon = "ph-cloud-rain";
        const dayEl = document.getElementById(`forecast-day-${i}`);
        const icoEl = document.getElementById(`forecast-icon-${i}`);
        const tmpEl = document.getElementById(`forecast-temp-${i}`);
        if (dayEl) dayEl.innerText = i === 1 ? "Tomorrow" : days[d.getDay()];
        if (icoEl) icoEl.className = `ph-fill ${fIcon}`;
        if (tmpEl)
          tmpEl.innerText = `${Math.round(daily.temperature_2m_max[i])}°`;
      }
    } catch (err) {
      console.error("Weather fallback failed:", err);
      const descEl = document.getElementById("weather-desc");
      if (descEl) descEl.innerText = "Weather data unavailable.";
    }
  }

  //  INIT
  renderHistoryTable();
  updateOverviewCount();

  (async () => {
    await detectUserCity();
    await fetchWeatherData();
  })();
});
