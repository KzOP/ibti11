import express from "express";
import Groq from "groq-sdk";

const app = express();
const PORT = 3001;

app.use(express.json());

const SYSTEM_PROMPT = `أنت مساعد ذكي مخصص لمساعدة الطلاب في موقع ابتعاثي المتخصص في شؤون الابتعاث والدراسة وحساب النسب الموزونة للجامعات السعودية والدولية.

مهامك الأساسية:
1. الإجابة على استفسارات الطلاب حول شروط الابتعاث (مثل برنامج خادم الحرمين الشريفين للابتعاث)، ومواعيد التقديم، والتخصصات.
2. إرشاد الطلاب إلى كيفية حساب النسب الموزونة للجامعات السعودية، وتوجيههم لاستخدام الحاسبة المتوفرة في الموقع عند الحاجة لعمليات حسابية دقيقة.
3. التعريف بأقسام الموقع وخدماته وكيف يمكن للطالب الاستفادة منها.
4. اقتراح تخصصات مناسبة بناءً على اهتمامات الطالب.
5. توضيح الفرق بين البرامج الدراسية المختلفة.
6. شرح متطلبات اختبارات SAT وACT والقدرات والتحصيلي.

قواعد وسلوكيات يجب الالتزام بها:
- أجب دائماً باللغة العربية الفصحى المبسطة وبأسلوب ودي ومحفز للطلاب.
- إذا سألك المستخدم عن أي موضوع خارج نطاق الابتعاث والجامعات والدراسة، اعتذر منه بلطف واشرح له أنك مخصص لمساعدة الطلاب في الجوانب الأكاديمية فقط.
- تجنب إعطاء نسب قبول قطعية للجامعات ما لم تكن متأكداً منها تماماً.
- وجّه الطالب دائماً للتأكد من القنوات الرسمية وحاسبة الموقع.
- لا تعطي معلومات غير مؤكدة كحقائق نهائية، وانصح دائماً بمراجعة المصدر الرسمي.
- ابدأ ردودك بشكل مباشر ومفيد.`;

app.post("/api/chat", async (req, res) => {
  const { message, history } = req.body;

  const apiKey = process.env.GROQ_API_KEY;
  console.log("[Groq] API KEY EXISTS:", !!apiKey);
  console.log("[Groq] Model: llama-3.3-70b-versatile");

  if (!apiKey || apiKey.trim() === "") {
    console.error("[Groq] ERROR: GROQ_API_KEY is not set");
    return res.status(500).json({ error: "GROQ_KEY_MISSING" });
  }

  const groq = new Groq({ apiKey: apiKey.trim() });

  try {
    const messages = [
      { role: "system" as const, content: SYSTEM_PROMPT },
      ...(Array.isArray(history) ? history : []),
      { role: "user" as const, content: message },
    ];

    console.log("[Groq] Sending request with", messages.length, "messages");

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages,
      max_tokens: 1024,
      temperature: 0.7,
    });

    const reply = completion.choices[0]?.message?.content ?? "";
    console.log("[Groq] Response received, length:", reply.length);
    return res.json({ reply });
  } catch (err: unknown) {
    console.error("[Groq] Full error:", err);
    const msg = err instanceof Error ? err.message : String(err);

    if (msg.includes("401") || msg.includes("invalid_api_key") || msg.includes("Unauthorized")) {
      return res.status(401).json({ error: "GROQ_KEY_INVALID" });
    }
    if (msg.includes("429") || msg.includes("rate_limit") || msg.includes("quota")) {
      return res.status(429).json({ error: "GROQ_QUOTA_EXCEEDED" });
    }
    if (msg.includes("model") && msg.includes("not found")) {
      return res.status(404).json({ error: "GROQ_MODEL_NOT_FOUND" });
    }
    return res.status(500).json({ error: "GROQ_API_ERROR: " + msg });
  }
});

app.listen(PORT, () => {
  console.log(`[Groq Server] Running on http://localhost:${PORT}`);
});
