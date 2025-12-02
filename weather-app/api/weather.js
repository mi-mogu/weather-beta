// api/weather.js
const WEATHER_API_KEY = process.env.WEATHER_API_KEY;
const WEATHER_BASE_URL = "https://api.weatherapi.com/v1";

module.exports = async (req, res) => {
  const { city, lat, lon } = req.query || {};

  // city 또는 좌표(lat, lon) 중 하나가 필요
  let query;
  if (city) {
    query = encodeURIComponent(city);
  } else if (lat && lon) {
    query = `${lat},${lon}`;
  } else {
    res.status(400).json({ error: "city 또는 lat/lon 쿼리 파라미터가 필요합니다." });
    return;
  }

  try {
    const url = `${WEATHER_BASE_URL}/forecast.json?key=${WEATHER_API_KEY}&q=${query}&days=3&lang=ko`;

    const apiRes = await fetch(url);

    if (!apiRes.ok) {
      const errText = await apiRes.text();
      console.error("WeatherAPI error:", errText);
      res.status(500).json({ error: "WeatherAPI 호출 실패" });
      return;
    }

    const data = await apiRes.json();
    res.status(200).json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "서버 내부 오류" });
  }
};
