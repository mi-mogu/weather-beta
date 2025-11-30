// ==== 0. DOM 요소 선택 ====
const cityInput = document.getElementById("city-input");
const searchBtn = document.getElementById("search-btn");
const cityNameEl = document.getElementById("city-name");
const currentTempValueEl = document.getElementById("current-temp-value");
const futureTempListEl = document.getElementById("future-temp-list");
const hourlyListEl = document.getElementById("hourly-list");
const weatherImageEl = document.querySelector(".weather-image");
const outfitTextEl = document.getElementById("outfit-text");
const translatedCityEl = document.getElementById("translated-city");
const cityLocalTimeEl = document.getElementById("city-local-time");
const weatherEffectsEl = document.getElementById("weather-effects");

// 모드 인디케이터(AI / 기본)
const modeAiEl = document.getElementById("mode-ai");
const modeBasicEl = document.getElementById("mode-basic");

// 🔹 최근 검색 DOM
const historyListEl = document.getElementById("history-list");
const clearHistoryBtn = document.getElementById("clear-history-btn");

// 🔹 최근 검색 상태 + localStorage 키
const HISTORY_KEY = "weatherSearchHistory";
let searchHistory = [];

// ==== 1. 옷차림 모드 표시 ====
// mode: "ai" | "basic" | null
function setOutfitMode(mode) {
  if (!modeAiEl || !modeBasicEl) return;

  modeAiEl.classList.remove("mode-pill--active");
  modeBasicEl.classList.remove("mode-pill--active");

  if (mode === "ai") {
    modeAiEl.classList.add("mode-pill--active");
  } else if (mode === "basic") {
    modeBasicEl.classList.add("mode-pill--active");
  }
}
// 처음에는 아무 색도 안 들어온 상태 (호출 X)

// ==== 1.5. 날씨 효과 (비/눈) ====
function applyWeatherEffect(conditionCode) {
  if (!weatherEffectsEl) return;
  
  // 기존 효과 제거
  weatherEffectsEl.innerHTML = "";
  weatherEffectsEl.className = "weather-effects";
  
  // WeatherAPI condition codes:
  // 비: 1063, 1180, 1183, 1186, 1189, 1192, 1195, 1240, 1243, 1246, 1273, 1276
  // 눈: 1066, 1114, 1117, 1210, 1213, 1216, 1219, 1222, 1225, 1255, 1258, 1279, 1282
  // 진눈깨비: 1069, 1072, 1168, 1171, 1198, 1201, 1204, 1207, 1237, 1249, 1252
  
  const rainCodes = [1063, 1150, 1153, 1180, 1183, 1186, 1189, 1192, 1195, 1240, 1243, 1246, 1273, 1276];
  const snowCodes = [1066, 1114, 1117, 1210, 1213, 1216, 1219, 1222, 1225, 1255, 1258, 1279, 1282];
  const sleetCodes = [1069, 1072, 1168, 1171, 1198, 1201, 1204, 1207, 1237, 1249, 1252];
  
  let effectType = null;
  let particleCount = 50;
  
  if (rainCodes.includes(conditionCode)) {
    effectType = "rain";
    particleCount = 80;
  } else if (snowCodes.includes(conditionCode)) {
    effectType = "snow";
    particleCount = 60;
  } else if (sleetCodes.includes(conditionCode)) {
    effectType = "sleet";
    particleCount = 50;
  }
  
  if (!effectType) return;
  
  weatherEffectsEl.classList.add(`effect-${effectType}`);
  
  // 파티클 생성
  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement("div");
    particle.className = `particle particle-${effectType}`;
    
    // 랜덤 위치 및 애니메이션 지연
    particle.style.left = `${Math.random() * 100}%`;
    particle.style.animationDelay = `${Math.random() * 2}s`;
    particle.style.animationDuration = effectType === "snow" 
      ? `${3 + Math.random() * 4}s` 
      : `${0.5 + Math.random() * 0.5}s`;
    
    if (effectType === "snow") {
      particle.style.opacity = `${0.4 + Math.random() * 0.6}`;
      particle.style.transform = `scale(${0.5 + Math.random() * 1})`;
    }
    
    weatherEffectsEl.appendChild(particle);
  }
}

// ==== 1.6. 시간에 따른 배경 테마 적용 ====
function applyTimeTheme(localtime) {
  // localtime 형식: "2024-01-15 14:30"
  const timePart = localtime.split(" ")[1]; // "14:30"
  const hour = parseInt(timePart.split(":")[0], 10);
  
  // 기존 테마 클래스 제거
  document.body.classList.remove(
    "theme-dawn",
    "theme-morning", 
    "theme-day", 
    "theme-sunset",
    "theme-evening", 
    "theme-night"
  );
  
  // 시간대별 테마 적용 (더 세분화)
  if (hour >= 5 && hour < 7) {
    document.body.classList.add("theme-dawn");     // 새벽 (5~7시)
  } else if (hour >= 7 && hour < 11) {
    document.body.classList.add("theme-morning");  // 아침 (7~11시)
  } else if (hour >= 11 && hour < 17) {
    document.body.classList.add("theme-day");      // 낮 (11~17시)
  } else if (hour >= 17 && hour < 19) {
    document.body.classList.add("theme-sunset");   // 일몰 (17~19시)
  } else if (hour >= 19 && hour < 21) {
    document.body.classList.add("theme-evening");  // 저녁 (19~21시)
  } else {
    document.body.classList.add("theme-night");    // 밤 (21~5시)
  }
}

// ==== 1.6. 도시 현지 시간 표시 ====
function displayCityLocalTime(localtime) {
  if (!cityLocalTimeEl) return;
  
  // localtime 형식: "2024-01-15 14:30"
  const [datePart, timePart] = localtime.split(" ");
  const [year, month, day] = datePart.split("-");
  const [hour, minute] = timePart.split(":");
  
  const hourNum = parseInt(hour, 10);
  const ampm = hourNum >= 12 ? "오후" : "오전";
  const hour12 = hourNum % 12 || 12;
  
  const formattedTime = `${month}월 ${day}일 ${ampm} ${hour12}:${minute}`;
  cityLocalTimeEl.textContent = `현지 시간: ${formattedTime}`;
}

// ==== 2. 최근 검색 히스토리 ====
function renderHistory() {
  if (!historyListEl) return;

  if (!searchHistory.length) {
    historyListEl.innerHTML =
      '<p class="history-empty">최근 검색 기록이 없습니다.</p>';
    return;
  }

  historyListEl.innerHTML = searchHistory
    .map(
      (term, index) => `
      <div class="history-item">
        <button type="button" class="history-term" data-index="${index}">
          ${term}
        </button>
        <button type="button" class="history-delete" data-index="${index}" aria-label="검색어 삭제">
          ✕
        </button>
      </div>
    `
    )
    .join("");
}

function saveHistory() {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(searchHistory));
  } catch (e) {
    console.error("히스토리 저장 실패:", e);
  }
}

function loadHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        searchHistory = parsed;
      }
    }
  } catch (e) {
    console.error("히스토리 로드 실패:", e);
  }
  renderHistory();
}

function addToHistory(term) {
  const value = term.trim();
  if (!value) return;

  // 중복 제거 후 맨 앞에 추가
  searchHistory = searchHistory.filter((t) => t !== value);
  searchHistory.unshift(value);

  // 최대 5개까지만 유지
  if (searchHistory.length > 5) {
    searchHistory = searchHistory.slice(0, 5);
  }

  saveHistory();
  renderHistory();
}

// ===============================================
// 3. 서버(Proxy) API 호출 함수들
// ===============================================

// 3-1. WeatherAPI → /api/weather (도시명은 영어)
async function getForecastByCity(cityEnglish) {
  const res = await fetch(
    `/api/weather?city=${encodeURIComponent(cityEnglish)}`
  );

  if (!res.ok) {
    console.error("WeatherAPI proxy error:", await res.text());
    throw new Error("날씨 정보를 가져오지 못했습니다.");
  }

  const data = await res.json();
  return data;
}

// 3-2. 번역 → /api/translate-city (한글 도시 → 영어 도시)
async function translateCityNameToEnglish(koreanCity) {
  const res = await fetch("/api/translate-city", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text: koreanCity }),
  });

  if (!res.ok) {
    console.error("Gemini translation proxy error:", await res.text());
    throw new Error("번역 API 호출 실패");
  }

  const data = await res.json();
  const english = data?.translatedCity?.trim();

  if (!english) {
    throw new Error("번역 결과를 읽을 수 없습니다.");
  }

  return english;
}

// 3-3. 옷차림 추천 → /api/outfit
async function recommendOutfitToKorea(temp, conditionText) {
  const res = await fetch("/api/outfit", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ temp, conditionText }),
  });

  if (!res.ok) {
    console.error("Gemini outfit proxy error:", await res.text());
    throw new Error("옷차림 추천 API 호출 실패");
  }

  const data = await res.json();
  const text = data?.outfit?.trim();

  if (!text) {
    throw new Error("옷차림 추천 결과를 읽을 수 없습니다.");
  }

  return text;
}

// =======================================================
// 4. JS 버전 옷차림 추천 (AI 실패 시 fallback)
// =======================================================
function getOutfitSuggestion(temp) {
  if (temp <= 0) {
    return "매우 추워요! 두꺼운 패딩, 목도리, 장갑을 꼭 준비하세요.";
  } else if (temp <= 5) {
    return "추운 편이에요. 코트나 패딩, 니트와 목도리를 추천해요.";
  } else if (temp <= 10) {
    return "쌀쌀해요. 자켓이나 얇은 코트, 니트와 긴 바지를 입는 게 좋아요.";
  } else if (temp <= 17) {
    return "선선한 날씨예요. 가벼운 가디건이나 맨투맨, 긴 바지를 추천해요.";
  } else if (temp <= 23) {
    return "딱 활동하기 좋은 날씨! 얇은 긴팔 또는 반팔에 가벼운 아우터 정도면 충분해요.";
  } else if (temp <= 27) {
    return "약간 더운 편이에요. 반팔과 얇은 바지, 시원한 소재의 옷을 추천해요.";
  } else {
    return "많이 더워요! 민소매, 반팔, 반바지 등 최대한 시원한 옷차림과 수분 보충을 잊지 마세요.";
  }
}

// =======================================================
// 5. 화면에 날씨/예보 렌더링 (일별 + 시간별)
// =======================================================
function renderWeather(data, displayCity) {
  // 1) 도시 이름: "서울의 날씨" 처럼 표시
  const cityName =
    displayCity && displayCity.trim()
      ? `${displayCity.trim()}의 날씨`
      : `${data.location.name}의 날씨`;

  if (cityNameEl) cityNameEl.textContent = cityName;

  // 2) 현재 온도
  const currentTemp = Math.round(data.current.temp_c);
  if (currentTempValueEl) currentTempValueEl.textContent = `${currentTemp} °C`;

  // 3) 날씨 아이콘 + 설명
  const conditionText = data.current.condition.text;
  const iconUrl = "https:" + data.current.condition.icon;

  if (weatherImageEl) {
    weatherImageEl.innerHTML = `
      <div class="weather-icon-wrapper">
        <img src="${iconUrl}" alt="${conditionText}" class="weather-icon" />
        <p class="weather-desc">${conditionText}</p>
      </div>
    `;
  }

  // 4) 미래 온도 (3일치 예보: 일별)
  const forecastDays = data.forecast.forecastday;
  const labels = ["오늘", "내일", "모레"];

  if (futureTempListEl) {
    futureTempListEl.innerHTML = forecastDays
      .map((day, index) => {
        const avgTemp = Math.round(day.day.avgtemp_c);
        const dateStr = day.date;
        const label = labels[index] || dateStr;

        return `
          <div class="future-temp-item">
            <span class="label">${label}</span>
            <span class="value">${avgTemp} °C</span>
          </div>
        `;
      })
      .join("");
  }

  // 5) 시간별 날씨 (1~3시간 후)
  if (hourlyListEl) {
    const allHours = [];
    forecastDays.forEach((day) => {
      day.hour.forEach((h) => allHours.push(h));
    });

    const currentEpoch =
      data.current.last_updated_epoch || data.location.localtime_epoch;

    const offsets = [1, 2, 3]; // 1시간, 2시간, 3시간 후
    const hourlyItemsHtml = offsets
      .map((offset) => {
        const targetEpoch = currentEpoch + offset * 3600;

        // targetEpoch 이후의 가장 가까운 시간 데이터
        let candidate = allHours.find((h) => h.time_epoch >= targetEpoch);
        if (!candidate) {
          candidate = allHours[allHours.length - 1];
        }

        const temp = Math.round(candidate.temp_c);
        const condTextHour = candidate.condition.text;
        const iconHourUrl = "https:" + candidate.condition.icon;

        return `
          <div class="hourly-item">
            <span class="label">${offset}시간 후</span>
            <img src="${iconHourUrl}" alt="${condTextHour}" class="hourly-icon" />
            <span class="value">${temp} °C</span>
          </div>
        `;
      })
      .join("");

    hourlyListEl.innerHTML = hourlyItemsHtml;
  }

  // 6) 날씨 효과 적용 (비/눈)
  const conditionCode = data.current.condition.code;
  applyWeatherEffect(conditionCode);

  // handleSearch에서 쓰도록 현재 온도와 설명 반환
  return { currentTemp, conditionText };
}

// =======================================================
// 6. 검색 처리 흐름
// =======================================================
async function handleSearch(initialInput) {
  const rawInput =
    initialInput !== undefined
      ? initialInput
      : cityInput
      ? cityInput.value
      : "";
  const userInput = rawInput.trim();

  if (!userInput) {
    alert("도시 이름을 입력해 주세요!");
    return;
  }

  try {
    // 로딩 상태 표시
    if (cityNameEl) cityNameEl.textContent = "번역 + 날씨 정보를 불러오는 중...";
    if (currentTempValueEl) currentTempValueEl.textContent = "-- °C";
    if (futureTempListEl) futureTempListEl.innerHTML = "";
    if (hourlyListEl) hourlyListEl.innerHTML = "";
    if (weatherImageEl) {
      weatherImageEl.innerHTML =
        '<span class="placeholder-text">불러오는 중...</span>';
    }
    if (outfitTextEl) outfitTextEl.textContent = "옷차림 추천을 준비 중입니다...";
    setOutfitMode(null); // 🔹 응답 전에는 둘 다 불 꺼진 상태

    if (translatedCityEl) {
      translatedCityEl.textContent = "번역된 도시: (번역 중...)";
    }

    // 1) 한글 → 영어 도시명 번역 (서버 경유)
    const englishCity = await translateCityNameToEnglish(userInput);
    console.log("번역된 도시명:", englishCity);

    if (translatedCityEl) {
      translatedCityEl.textContent = `번역된 도시: ${englishCity}`;
    }

    // 2) 번역된 도시명으로 날씨 호출 (서버 경유)
    const data = await getForecastByCity(englishCity);

    // 3) 화면 렌더링 (현재 온도, 날씨 설명 받아오기) — 화면엔 "서울의 날씨"처럼 한글 도시 사용
    const { currentTemp, conditionText } = renderWeather(data, userInput);

    // 🔹 도시 현지 시간 표시 및 테마 적용
    const localtime = data.location.localtime;
    displayCityLocalTime(localtime);
    applyTimeTheme(localtime);

    // 🔹 최근 검색 기록에 추가
    addToHistory(userInput);

    // 4) 옷차림 추천: 1순위 AI, 실패하면 JS 버전
    try {
      const aiOutfit = await recommendOutfitToKorea(
        currentTemp,
        conditionText
      );
      if (outfitTextEl) outfitTextEl.textContent = aiOutfit;
      setOutfitMode("ai"); // ✅ AI 응답: AI에 불 ON
    } catch (aiErr) {
      console.error("옷차림 AI 추천 실패, JS 버전으로 대체:", aiErr);
      const fallback = getOutfitSuggestion(currentTemp);
      if (outfitTextEl) outfitTextEl.textContent = fallback;
      setOutfitMode("basic"); // ✅ 실패 시 기본에 불 ON
    }
  } catch (err) {
    console.error(err);
    if (cityNameEl) cityNameEl.textContent = "날씨 정보를 가져오지 못했습니다 😢";
    if (currentTempValueEl) currentTempValueEl.textContent = "-- °C";
    if (futureTempListEl) futureTempListEl.innerHTML = "";
    if (hourlyListEl) hourlyListEl.innerHTML = "";
    if (weatherImageEl) {
      weatherImageEl.innerHTML =
        '<span class="placeholder-text">오류 발생</span>';
    }
    if (outfitTextEl) outfitTextEl.textContent = "옷차림 추천을 불러오지 못했습니다.";
    setOutfitMode(null);

    if (translatedCityEl) {
      translatedCityEl.textContent = "번역된 도시: (불러오기 실패)";
    }
  }
}

// =======================================================
// 7. 이벤트 리스너
// =======================================================
if (searchBtn) {
  searchBtn.addEventListener("click", () => handleSearch());
}

if (cityInput) {
  cityInput.addEventListener("keyup", (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  });
}

// 🔹 최근 검색 리스트 클릭 / 삭제 처리
if (historyListEl) {
  historyListEl.addEventListener("click", (e) => {
    const termBtn = e.target.closest(".history-term");
    const delBtn = e.target.closest(".history-delete");

    if (termBtn) {
      const idx = Number(termBtn.dataset.index);
      const term = searchHistory[idx];
      if (term && cityInput) {
        cityInput.value = term;
      }
      handleSearch(term);
      return;
    }

    if (delBtn) {
      const idx = Number(delBtn.dataset.index);
      if (!Number.isNaN(idx)) {
        searchHistory.splice(idx, 1);
        saveHistory();
        renderHistory();
      }
    }
  });
}

// 🔹 전체 삭제 버튼
if (clearHistoryBtn) {
  clearHistoryBtn.addEventListener("click", () => {
    searchHistory = [];
    saveHistory();
    renderHistory();
  });
}

// 🔹 페이지 로드 시 히스토리 불러오기
loadHistory();
