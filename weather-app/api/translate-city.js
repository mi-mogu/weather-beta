// api/translate-city.js
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const GEMINI_MODEL = "gemini-2.0-flash-lite";

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "POST만 지원합니다." });
    return;
  }

  const { text } = req.body || {};
  if (!text) {
    res.status(400).json({ error: "text(번역할 도시명)가 없습니다." });
    return;
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

    const body = {
      contents: [
        {
          role: "user",
          parts: [
            {
              text:
                "You are a city name translator with content filtering.\n\n" +
                "RULES:\n" +
                "1. If the input contains profanity, slurs, offensive language, inappropriate content, or is NOT a valid city/location name, respond with exactly: INVALID\n" +
                "2. If the input is a valid Korean city/location name, translate it to English.\n" +
                "3. Answer with English city name only. No extra words, quotes, or explanations.\n\n" +
                `Input: ${text}`,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0,
        maxOutputTokens: 16,
        responseMimeType: "text/plain",
      },
    };

    const apiRes = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": GOOGLE_API_KEY,
      },
      body: JSON.stringify(body),
    });

    if (!apiRes.ok) {
      const errText = await apiRes.text();
      console.error("Gemini translation error:", errText);
      res.status(500).json({ error: "Gemini 번역 API 오류" });
      return;
    }

    const data = await apiRes.json();
    const translated =
      data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (!translated) {
      res.status(500).json({ error: "번역 결과를 읽을 수 없습니다." });
      return;
    }

    // 비속어/부적절한 입력 필터링
    if (translated === "INVALID" || translated.toUpperCase() === "INVALID") {
      res.status(400).json({ error: "유효하지 않은 도시명입니다. 올바른 도시 이름을 입력해주세요." });
      return;
    }

    res.status(200).json({ translatedCity: translated });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "서버 내부 오류" });
  }
};
