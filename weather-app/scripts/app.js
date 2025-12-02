// ==================================================
// 날씨 검색 앱 - Weather Search Application
// ==================================================

// ==== DOM 요소 선택 ====
const $ = (selector) => document.querySelector(selector);
const $id = (id) => document.getElementById(id);

const elements = {
  cityInput: $id("city-input"),
  searchBtn: $id("search-btn"),
  resetBtn: $id("reset-btn"),
  cityName: $id("city-name"),
  currentTempValue: $id("current-temp-value"),
  weatherDesc: $id("weather-desc"),
  futureTempList: $id("future-temp-list"),
  hourlyList: $id("hourly-list"),
  weatherImage: $(".weather-image"),
  outfitText: $id("outfit-text"),
  translatedCity: $id("translated-city"),
  cityLocalTime: $id("city-local-time"),
  weatherEffects: $id("weather-effects"),
  modeAi: $id("mode-ai"),
  modeBasic: $id("mode-basic"),
  historyList: $id("history-list"),
  clearHistoryBtn: $id("clear-history-btn"),
};

// ==== 상수 ====
const HISTORY_KEY = "weatherSearchHistory";
const MAX_HISTORY = 5;

// 날씨 코드 분류
const WEATHER_CODES = {
  rain: [1063, 1150, 1153, 1180, 1183, 1186, 1189, 1192, 1195, 1240, 1243, 1246, 1273, 1276],
  snow: [1066, 1114, 1117, 1210, 1213, 1216, 1219, 1222, 1225, 1255, 1258, 1279, 1282],
  sleet: [1069, 1072, 1168, 1171, 1198, 1201, 1204, 1207, 1237, 1249, 1252],
};

// ==== 상태 ====
let searchHistory = [];
let typingTimeout = null;

// ==================================================
// 유틸리티 함수
// ==================================================

// 타이핑 효과
function typeText(element, text, speed = 25) {
  if (!element) return;
  
  if (typingTimeout) {
    clearTimeout(typingTimeout);
    typingTimeout = null;
  }
  
  element.textContent = "";
  element.classList.add("typing");
  
  let index = 0;
  
  function type() {
    if (index < text.length) {
      element.textContent += text.charAt(index);
      index++;
      typingTimeout = setTimeout(type, speed);
    } else {
      element.classList.remove("typing");
      typingTimeout = null;
    }
  }
  
  type();
}

// 옷차림 모드 표시
function setOutfitMode(mode) {
  const { modeAi, modeBasic } = elements;
  if (!modeAi || !modeBasic) return;

  modeAi.classList.toggle("mode-pill--active", mode === "ai");
  modeBasic.classList.toggle("mode-pill--active", mode === "basic");
}

// ==================================================
// 날씨 효과
// ==================================================
function applyWeatherEffect(conditionCode) {
  const { weatherEffects } = elements;
  if (!weatherEffects) return;
  
  weatherEffects.innerHTML = "";
  weatherEffects.className = "weather-effects";
  
  let effectType = null;
  let particleCount = 50;
  
  if (WEATHER_CODES.rain.includes(conditionCode)) {
    effectType = "rain";
    particleCount = 80;
  } else if (WEATHER_CODES.snow.includes(conditionCode)) {
    effectType = "snow";
    particleCount = 60;
  } else if (WEATHER_CODES.sleet.includes(conditionCode)) {
    effectType = "sleet";
    particleCount = 50;
  }
  
  if (!effectType) return;
  
  weatherEffects.classList.add(`effect-${effectType}`);
  
  const fragment = document.createDocumentFragment();
  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement("div");
    particle.className = `particle particle-${effectType}`;
    particle.style.left = `${Math.random() * 100}%`;
    particle.style.animationDelay = `${Math.random() * 2}s`;
    particle.style.animationDuration = effectType === "snow" 
      ? `${3 + Math.random() * 4}s` 
      : `${0.5 + Math.random() * 0.5}s`;
    
    if (effectType === "snow") {
      particle.style.opacity = `${0.4 + Math.random() * 0.6}`;
      particle.style.transform = `scale(${0.5 + Math.random() * 1})`;
    }
    
    fragment.appendChild(particle);
  }
  weatherEffects.appendChild(fragment);
}

// ==================================================
// 시간 테마
// ==================================================
function applyTimeTheme(localtime) {
  const hour = parseInt(localtime.split(" ")[1].split(":")[0], 10);
  
  const themes = ["theme-dawn", "theme-morning", "theme-day", "theme-sunset", "theme-evening", "theme-night"];
  document.body.classList.remove(...themes);
  
  const themeMap = [
    [5, 7, "theme-dawn"],
    [7, 11, "theme-morning"],
    [11, 17, "theme-day"],
    [17, 19, "theme-sunset"],
    [19, 21, "theme-evening"],
  ];
  
  const theme = themeMap.find(([start, end]) => hour >= start && hour < end)?.[2] || "theme-night";
  document.body.classList.add(theme);
}

function displayCityLocalTime(localtime) {
  const { cityLocalTime } = elements;
  if (!cityLocalTime) return;
  
  const [datePart, timePart] = localtime.split(" ");
  const [, month, day] = datePart.split("-");
  const [hour, minute] = timePart.split(":");
  
  const hourNum = parseInt(hour, 10);
  const ampm = hourNum >= 12 ? "오후" : "오전";
  const hour12 = hourNum % 12 || 12;
  
  cityLocalTime.textContent = `현지 시간: ${month}월 ${day}일 ${ampm} ${hour12}:${minute}`;
}

// ==================================================
// 검색 히스토리
// ==================================================
function renderHistory() {
  const { historyList } = elements;
  if (!historyList) return;

  if (!searchHistory.length) {
    historyList.innerHTML = '<p class="history-empty">최근 검색 기록이 없습니다.</p>';
    return;
  }

  historyList.innerHTML = searchHistory
    .map((term, index) => `
      <div class="history-item">
        <button type="button" class="history-term" data-index="${index}">${term}</button>
        <button type="button" class="history-delete" data-index="${index}" aria-label="검색어 삭제">✕</button>
      </div>
    `)
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
      if (Array.isArray(parsed)) searchHistory = parsed;
    }
  } catch (e) {
    console.error("히스토리 로드 실패:", e);
  }
  renderHistory();
}

function addToHistory(term) {
  const value = term.trim();
  if (!value) return;

  searchHistory = searchHistory.filter((t) => t !== value);
  searchHistory.unshift(value);
  
  if (searchHistory.length > MAX_HISTORY) {
    searchHistory = searchHistory.slice(0, MAX_HISTORY);
  }

  saveHistory();
  renderHistory();
}

// ==================================================
// API 호출 함수
// ==================================================
async function getForecastByCity(cityEnglish) {
  const res = await fetch(`/api/weather?city=${encodeURIComponent(cityEnglish)}`);
  if (!res.ok) throw new Error("날씨 정보를 가져오지 못했습니다.");
  return res.json();
}

async function translateCityNameToEnglish(koreanCity) {
  const res = await fetch("/api/translate-city", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: koreanCity }),
  });
  if (!res.ok) throw new Error("번역 API 호출 실패");
  
  const data = await res.json();
  const english = data?.translatedCity?.trim();
  if (!english) throw new Error("번역 결과를 읽을 수 없습니다.");
  return english;
}

async function recommendOutfitToKorea(temp, conditionText) {
  const res = await fetch("/api/outfit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ temp, conditionText }),
  });
  if (!res.ok) throw new Error("옷차림 추천 API 호출 실패");
  
  const data = await res.json();
  const text = data?.outfit?.trim();
  if (!text) throw new Error("옷차림 추천 결과를 읽을 수 없습니다.");
  return text;
}

// ==================================================
// 옷차림 추천 (AI 실패 시 fallback)
// ==================================================
function getOutfitSuggestion(temp) {
  const suggestions = [
    [0, "매우 추워요! 두꺼운 패딩, 목도리, 장갑을 꼭 준비하세요."],
    [5, "추운 편이에요. 코트나 패딩, 니트와 목도리를 추천해요."],
    [10, "쌀쌀해요. 자켓이나 얇은 코트, 니트와 긴 바지를 입는 게 좋아요."],
    [17, "선선한 날씨예요. 가벼운 가디건이나 맨투맨, 긴 바지를 추천해요."],
    [23, "딱 활동하기 좋은 날씨! 얇은 긴팔 또는 반팔에 가벼운 아우터 정도면 충분해요."],
    [27, "약간 더운 편이에요. 반팔과 얇은 바지, 시원한 소재의 옷을 추천해요."],
    [Infinity, "많이 더워요! 민소매, 반팔, 반바지 등 최대한 시원한 옷차림과 수분 보충을 잊지 마세요."],
  ];
  return suggestions.find(([max]) => temp <= max)[1];
}

// ==================================================
// 날씨 렌더링
// ==================================================
function renderWeather(data, displayCity) {
  const { cityName: cityNameEl, currentTempValue, weatherDesc, weatherImage, futureTempList, hourlyList } = elements;

  // 도시 이름
  const cityTitle = displayCity?.trim() ? `${displayCity.trim()}의 날씨` : `${data.location.name}의 날씨`;
  if (cityNameEl) cityNameEl.textContent = cityTitle;

  // 현재 온도
  const currentTemp = Math.round(data.current.temp_c);
  if (currentTempValue) currentTempValue.textContent = `${currentTemp}°`;

  // 날씨 아이콘 + 설명
  const conditionText = data.current.condition.text;
  const iconUrl = "https:" + data.current.condition.icon;

  if (weatherDesc) weatherDesc.textContent = conditionText;
  if (weatherImage) {
    weatherImage.innerHTML = `
      <div class="weather-icon-wrapper">
        <img src="${iconUrl}" alt="${conditionText}" class="weather-icon" />
      </div>
    `;
  }

  // 일별 예보
  const forecastDays = data.forecast.forecastday;
  const labels = ["오늘", "내일", "모레"];

  if (futureTempList) {
    futureTempList.innerHTML = forecastDays
      .map((day, i) => `
        <div class="future-temp-item">
          <span class="label">${labels[i] || day.date}</span>
          <img src="https:${day.day.condition.icon}" alt="${day.day.condition.text}" class="day-icon" />
          <span class="value">${Math.round(day.day.avgtemp_c)}°</span>
        </div>
      `)
      .join("");
  }

  // 시간별 예보
  if (hourlyList) {
    const allHours = forecastDays.flatMap((day) => day.hour);
    const currentEpoch = data.current.last_updated_epoch || data.location.localtime_epoch;

    hourlyList.innerHTML = Array.from({ length: 12 }, (_, i) => {
      const targetEpoch = currentEpoch + (i + 1) * 3600;
      const hour = allHours.find((h) => h.time_epoch >= targetEpoch) || allHours[allHours.length - 1];
      const hourTime = new Date(hour.time_epoch * 1000);
      const h = hourTime.getHours();
      const timeLabel = `${h >= 12 ? "오후" : "오전"} ${h % 12 || 12}시`;

      return `
        <div class="hourly-item">
          <span class="label">${timeLabel}</span>
          <img src="https:${hour.condition.icon}" alt="${hour.condition.text}" class="hourly-icon" />
          <span class="value">${Math.round(hour.temp_c)}°</span>
        </div>
      `;
    }).join("");
  }

  // 날씨 효과
  applyWeatherEffect(data.current.condition.code);

  return { currentTemp, conditionText };
}

// ==================================================
// 검색 처리
// ==================================================
async function handleSearch(initialInput) {
  const { cityInput, cityName, currentTempValue, futureTempList, hourlyList, weatherImage, outfitText, translatedCity } = elements;
  
  const userInput = (initialInput ?? cityInput?.value ?? "").trim();

  if (!userInput) {
    alert("도시 이름을 입력해 주세요!");
    return;
  }

  // 기존 컨텐츠 페이드아웃
  const fadeOutContent = () => {
    return new Promise((resolve) => {
      const weatherMain = document.querySelector('.weather-main');
      const futureTemp = document.querySelector('.future-temp');
      const hourlyTemp = document.querySelector('.hourly-temp');
      const outfitSection = document.querySelector('.outfit-section');
      const weatherCard = document.querySelector('.weather-card');
      
      // 컨텐츠가 있으면 페이드아웃
      if (cityName?.textContent && cityName.textContent !== '도시를 검색해주세요') {
        weatherCard?.classList.add('transitioning');
        weatherMain?.classList.add('fade-out');
        futureTemp?.classList.add('fade-out');
        hourlyTemp?.classList.add('fade-out');
        outfitSection?.classList.add('fade-out');
        
        setTimeout(resolve, 400);
      } else {
        resolve();
      }
    });
  };

  // 새 컨텐츠 페이드인
  const fadeInContent = () => {
    const weatherMain = document.querySelector('.weather-main');
    const futureTemp = document.querySelector('.future-temp');
    const hourlyTemp = document.querySelector('.hourly-temp');
    const outfitSection = document.querySelector('.outfit-section');
    const weatherCard = document.querySelector('.weather-card');
    
    // 페이드아웃 클래스 제거
    weatherCard?.classList.remove('transitioning');
    weatherMain?.classList.remove('fade-out');
    futureTemp?.classList.remove('fade-out');
    hourlyTemp?.classList.remove('fade-out');
    outfitSection?.classList.remove('fade-out');
    
    // 순차적 페이드인
    setTimeout(() => weatherMain?.classList.add('fade-in'), 0);
    setTimeout(() => futureTemp?.classList.add('fade-in'), 100);
    setTimeout(() => hourlyTemp?.classList.add('fade-in'), 200);
    setTimeout(() => outfitSection?.classList.add('fade-in'), 300);
    
    // 애니메이션 완료 후 클래스 제거
    setTimeout(() => {
      weatherMain?.classList.remove('fade-in');
      futureTemp?.classList.remove('fade-in');
      hourlyTemp?.classList.remove('fade-in');
      outfitSection?.classList.remove('fade-in');
    }, 800);
  };

  // 로딩 상태
  const setLoading = () => {
    if (cityName) {
      cityName.innerHTML = '<span class="loading-text"><span class="loading-spinner"></span>로딩 중...</span>';
    }
    if (currentTempValue) currentTempValue.textContent = "--°";
    if (futureTempList) futureTempList.innerHTML = "";
    if (hourlyList) hourlyList.innerHTML = "";
    if (weatherImage) {
      weatherImage.innerHTML = '<span class="loading-text"><span class="loading-spinner"></span></span>';
    }
    if (outfitText) outfitText.textContent = "옷차림 추천을 준비 중입니다...";
    if (translatedCity) {
      translatedCity.innerHTML = '<span class="loading-text"><span class="loading-spinner"></span>번역 중...</span>';
    }
    setOutfitMode(null);
    
    // 날씨 카드에 로딩 클래스 추가
    const weatherCard = document.querySelector('.weather-card');
    if (weatherCard) weatherCard.classList.add('loading');
  };

  const setError = () => {
    const weatherCard = document.querySelector('.weather-card');
    if (weatherCard) weatherCard.classList.remove('loading');
    
    if (cityName) cityName.textContent = "날씨 정보를 가져오지 못했습니다 😢";
    if (currentTempValue) currentTempValue.textContent = "--°";
    if (futureTempList) futureTempList.innerHTML = "";
    if (hourlyList) hourlyList.innerHTML = "";
    if (weatherImage) weatherImage.innerHTML = '<span class="placeholder-text">오류 발생</span>';
    if (outfitText) outfitText.textContent = "옷차림 추천을 불러오지 못했습니다.";
    if (translatedCity) translatedCity.textContent = "번역된 도시: (불러오기 실패)";
    setOutfitMode(null);
  };

  try {
    // 기존 컨텐츠 페이드아웃
    await fadeOutContent();
    
    setLoading();

    // 번역 및 날씨 데이터 가져오기
    const englishCity = await translateCityNameToEnglish(userInput);
    if (translatedCity) translatedCity.textContent = `번역된 도시: ${englishCity}`;

    const data = await getForecastByCity(englishCity);
    const actualCityName = data.location.name;

    // 로딩 클래스 제거
    const weatherCard = document.querySelector('.weather-card');
    if (weatherCard) weatherCard.classList.remove('loading');

    // 렌더링
    const { currentTemp, conditionText } = renderWeather(data, actualCityName);
    if (translatedCity) translatedCity.textContent = `검색: ${userInput} → ${actualCityName}`;
    
    // 새 컨텐츠 페이드인
    fadeInContent();

    // 시간 테마 적용
    displayCityLocalTime(data.location.localtime);
    applyTimeTheme(data.location.localtime);

    // 검색 기록 추가
    addToHistory(userInput);

    // 옷차림 추천
    try {
      const aiOutfit = await recommendOutfitToKorea(currentTemp, conditionText);
      typeText(outfitText, aiOutfit, 20);
      setOutfitMode("ai");
    } catch {
      typeText(outfitText, getOutfitSuggestion(currentTemp), 20);
      setOutfitMode("basic");
    }
  } catch (err) {
    console.error(err);
    setError();
  }
}

// ==================================================
// 이벤트 리스너
// ==================================================
function initEventListeners() {
  const { searchBtn, cityInput, historyList, clearHistoryBtn, resetBtn } = elements;

  // 검색 버튼
  searchBtn?.addEventListener("click", () => handleSearch());

  // Enter 키 검색
  cityInput?.addEventListener("keyup", (e) => {
    if (e.key === "Enter") handleSearch();
  });

  // 검색 히스토리 클릭/삭제
  historyList?.addEventListener("click", (e) => {
    const termBtn = e.target.closest(".history-term");
    const delBtn = e.target.closest(".history-delete");

    if (termBtn) {
      const idx = Number(termBtn.dataset.index);
      const term = searchHistory[idx];
      if (term && cityInput) cityInput.value = term;
      handleSearch(term);
    } else if (delBtn) {
      const idx = Number(delBtn.dataset.index);
      if (!Number.isNaN(idx)) {
        // 삭제 애니메이션
        const item = delBtn.closest(".history-item");
        if (item) {
          item.classList.add("removing");
          item.addEventListener("animationend", () => {
            searchHistory.splice(idx, 1);
            saveHistory();
            renderHistory();
          }, { once: true });
        } else {
          searchHistory.splice(idx, 1);
          saveHistory();
          renderHistory();
        }
      }
    }
  });

  // 전체 삭제 (순차적 애니메이션)
  clearHistoryBtn?.addEventListener("click", () => {
    const items = historyList?.querySelectorAll(".history-item");
    if (items && items.length > 0) {
      items.forEach((item, i) => {
        setTimeout(() => {
          item.classList.add("removing");
        }, i * 50);
      });
      
      // 모든 애니메이션 완료 후 삭제
      setTimeout(() => {
        searchHistory = [];
        saveHistory();
        renderHistory();
      }, items.length * 50 + 300);
    } else {
      searchHistory = [];
      saveHistory();
      renderHistory();
    }
  });

  // 초기화 버튼
  resetBtn?.addEventListener("click", resetToInitialState);
}

// ==================================================
// 초기화 기능
// ==================================================
function resetToInitialState() {
  const { cityInput, cityName, currentTempValue, weatherDesc, futureTempList, hourlyList, weatherImage, translatedCity, cityLocalTime, outfitText, weatherEffects, resetBtn } = elements;

  // 페이드아웃 효과 적용
  const weatherMain = document.querySelector('.weather-main');
  const futureTemp = document.querySelector('.future-temp');
  const hourlyTemp = document.querySelector('.hourly-temp');
  const outfitSection = document.querySelector('.outfit-section');
  const weatherCard = document.querySelector('.weather-card');
  
  // 컨텐츠가 있으면 페이드아웃 후 초기화
  if (cityName?.textContent && cityName.textContent !== '도시를 검색해주세요') {
    weatherCard?.classList.add('transitioning');
    weatherMain?.classList.add('fade-out');
    futureTemp?.classList.add('fade-out');
    hourlyTemp?.classList.add('fade-out');
    outfitSection?.classList.add('fade-out');
    
    setTimeout(() => {
      // 초기화 수행
      performReset();
      
      // 페이드아웃 클래스 제거
      weatherCard?.classList.remove('transitioning');
      weatherMain?.classList.remove('fade-out');
      futureTemp?.classList.remove('fade-out');
      hourlyTemp?.classList.remove('fade-out');
      outfitSection?.classList.remove('fade-out');
      
      // 페이드인 효과
      setTimeout(() => weatherMain?.classList.add('fade-in'), 0);
      setTimeout(() => outfitSection?.classList.add('fade-in'), 100);
      
      // 애니메이션 완료 후 클래스 제거
      setTimeout(() => {
        weatherMain?.classList.remove('fade-in');
        outfitSection?.classList.remove('fade-in');
      }, 600);
    }, 400);
  } else {
    performReset();
  }
  
  function performReset() {
    if (cityInput) cityInput.value = "";
    if (cityName) cityName.textContent = "도시를 검색해주세요";
    if (currentTempValue) currentTempValue.textContent = "--°";
    if (weatherDesc) weatherDesc.textContent = "날씨 정보";
    if (futureTempList) futureTempList.innerHTML = "";
    if (hourlyList) hourlyList.innerHTML = "";
    if (weatherImage) weatherImage.innerHTML = '<span class="placeholder-text">🌤️</span>';
    if (translatedCity) translatedCity.textContent = "번역된 도시: (아직 없음)";
    if (cityLocalTime) cityLocalTime.textContent = "";
    if (outfitText) outfitText.textContent = "날씨를 검색하면 이곳에 옷차림 추천이 표시됩니다.";
    if (weatherEffects) weatherEffects.innerHTML = "";
    
    setOutfitMode(null);
    document.body.className = "";
  }

  // 버튼 클릭 효과
  if (resetBtn) {
    resetBtn.classList.add("clicked");
    setTimeout(() => resetBtn.classList.remove("clicked"), 200);
  }
}

// ==================================================
// 앱 초기화
// ==================================================
function init() {
  loadHistory();
  initEventListeners();
}

init();
