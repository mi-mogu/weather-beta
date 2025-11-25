// api/outfit.js
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const GEMINI_MODEL = "gemini-2.0-flash-lite";

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "POST만 지원합니다." });
    return;
  }

  const { temp, conditionText } = req.body || {};

  if (typeof temp !== "number" || !conditionText) {
    res.status(400).json({ error: "temp(숫자), conditionText(문자)가 필요합니다." });
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
              text: `
Current temperature: ${temp}°C.
Weather condition: ${conditionText}.

Recommend an outfit in ONE short sentence.
Reply in Korean only.
              `.trim(),
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 1.0,
        maxOutputTokens: 64,
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
      console.error("Gemini outfit error:", errText);
      res.status(500).json({ error: "Gemini 옷차림 API 오류" });
      return;
    }

    const data = await apiRes.json();
    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (!text) {
      res.status(500).json({ error: "옷차림 결과를 읽을 수 없습니다." });
      return;
    }

    res.status(200).json({ outfit: text });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "서버 내부 오류" });
  }
};
