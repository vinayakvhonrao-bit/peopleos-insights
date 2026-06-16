import { createServerFn } from "@tanstack/react-start";

export interface InsightsInput {
  period: string;
  activeWorkers: number;
  totalWorkers: number;
  monthlyRunRateUSD: number;
  intlPct: number;
  anomalyCount: number;
  anomalyBreakdown: { type: string; count: number }[];
  conservative: {
    endingHeadcount: number;
    annualCompUSD: number;
    percentDelta: number;
    cumulativeBurnUSD: number;
  };
  growth: {
    endingHeadcount: number;
    annualCompUSD: number;
    percentDelta: number;
    cumulativeBurnUSD: number;
  };
  topGrowthDept: { dept: string; deltaCost: number };
}

export const generateInsights = createServerFn({ method: "POST" })
  .inputValidator((data: InsightsInput) => data)
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      return {
        ok: false as const,
        error: "AI Gateway is not configured (LOVABLE_API_KEY missing).",
        commentary: "",
      };
    }

    const systemPrompt = `You are an AI assistant writing executive commentary for the CFO and CHRO of a pre-IPO AI infrastructure company (NeoCloud Inc., ~530 employees).
- You ONLY summarize the structured metrics provided. Never invent numbers, employee names, or facts.
- Use plain English. No emojis. No greetings. No sign-off.
- Write 3 short paragraphs separated by blank lines:
  1) Current state (headcount, run rate, international mix, period).
  2) 12-month plan comparison (Conservative vs Growth: ending HC, annual comp delta, cumulative burn, where the dollars go).
  3) Risks and one concrete recommendation for the next 30 days.
- Bold key numbers using **markdown**. Keep total length under 220 words.`;

    const userPrompt = `Period: ${data.period}
Active workers: ${data.activeWorkers} of ${data.totalWorkers} total
Monthly burdened run rate: $${data.monthlyRunRateUSD.toLocaleString()}
International workforce: ${(data.intlPct * 100).toFixed(1)}%
Payroll anomalies flagged this period: ${data.anomalyCount}
Anomaly breakdown: ${data.anomalyBreakdown.map((a) => `${a.type} (${a.count})`).join("; ") || "none"}

Conservative IPO Plan (12 months):
- Ending headcount: ${data.conservative.endingHeadcount}
- Annual comp: $${data.conservative.annualCompUSD.toLocaleString()} (${(data.conservative.percentDelta * 100).toFixed(1)}% vs baseline)
- Cumulative 12-mo payroll burn: $${data.conservative.cumulativeBurnUSD.toLocaleString()}

AI Growth Plan (12 months):
- Ending headcount: ${data.growth.endingHeadcount}
- Annual comp: $${data.growth.annualCompUSD.toLocaleString()} (${(data.growth.percentDelta * 100).toFixed(1)}% vs baseline)
- Cumulative 12-mo payroll burn: $${data.growth.cumulativeBurnUSD.toLocaleString()}
- Largest department cost increase: ${data.topGrowthDept.dept} (+$${data.topGrowthDept.deltaCost.toLocaleString()})`;

    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
        }),
      });

      if (!res.ok) {
        const body = await res.text();
        return {
          ok: false as const,
          error: `AI Gateway error ${res.status}: ${body.slice(0, 200)}`,
          commentary: "",
        };
      }
      const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
      const commentary = json.choices?.[0]?.message?.content ?? "";
      return { ok: true as const, commentary, error: "" };
    } catch (e) {
      return {
        ok: false as const,
        error: e instanceof Error ? e.message : "Unknown error",
        commentary: "",
      };
    }
  });
