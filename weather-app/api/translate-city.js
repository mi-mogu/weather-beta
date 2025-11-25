// api/translate-city.js
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const GEMINI_MODEL = "gemini-2.5-flash-lite";

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
                "Translate Korean city name to English city name.\n" +
                "Answer with English city name only. No extra words or quotes.\n" +
                `Text: ${text}`,
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

    res.status(200).json({ translatedCity: translated });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "서버 내부 오류" });
  }
};
