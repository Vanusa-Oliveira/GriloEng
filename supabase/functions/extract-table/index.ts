import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64 } = await req.json();
    if (!imageBase64) {
      return new Response(JSON.stringify({ error: "imageBase64 is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `Você é um especialista em engenharia estrutural e extração de dados de tabelas de Relação de Aço (Armadura de Concreto).

Analise a imagem e extraia cada linha da tabela com as seguintes colunas:
- N: Número da posição
- bitola: diâmetro da barra em mm (valores comuns: 5.0, 6.3, 8.0, 10.0, 12.5, 16.0, 20.0, 25.0, 32.0)
- comp: comprimento em CENTÍMETROS (ex: 668, 578). Se houver rasura ou número sobreposto, utilize o valor que parece ser a correção final.
- q: quantidade de barras (inteiro)

IMPORTANTE: O campo "comp" deve ser retornado em CENTÍMETROS, exatamente como aparece na tabela. NÃO converta para metros.
Seja extremamente cuidadoso com a leitura dos números manuscritos.

Retorne APENAS um JSON válido no formato:
{"rows": [{"bitola": "10.0", "comp": 668, "q": 12}, ...]}

Se não encontrar dados de tabela de aço, retorne: {"rows": []}
Não inclua texto extra, apenas o JSON.`,
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Extraia os dados da tabela de aço desta imagem:",
              },
              {
                type: "image_url",
                image_url: {
                  url: imageBase64.startsWith("data:")
                    ? imageBase64
                    : `data:image/jpeg;base64,${imageBase64}`,
                },
              },
            ],
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_steel_table",
              description: "Extract steel table rows from image",
              parameters: {
                type: "object",
                properties: {
                  rows: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        bitola: { type: "string", description: "Bar diameter in mm" },
                        comp: { type: "number", description: "Length in meters" },
                        q: { type: "number", description: "Quantity (integer)" },
                      },
                      required: ["bitola", "comp", "q"],
                    },
                  },
                },
                required: ["rows"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_steel_table" } },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);

      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Tente novamente em alguns segundos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes. Adicione créditos no workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ error: "Erro ao processar imagem com IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    console.log("AI response:", JSON.stringify(data));

    // Extract from tool call response
    let rows: any[] = [];
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      try {
        const parsed = JSON.parse(toolCall.function.arguments);
        rows = parsed.rows || [];
      } catch (e) {
        console.error("Failed to parse tool call arguments:", e);
      }
    }

    // Fallback: try parsing content as JSON
    if (rows.length === 0) {
      const content = data.choices?.[0]?.message?.content;
      if (content) {
        try {
          const match = content.match(/\{[\s\S]*\}/);
          if (match) {
            const parsed = JSON.parse(match[0]);
            rows = parsed.rows || [];
          }
        } catch (e) {
          console.error("Failed to parse content:", e);
        }
      }
    }

    // Validate bitola values
    const validBitolas = ["5.0", "6.3", "8.0", "10.0", "12.5", "16.0", "20.0", "25.0", "32.0"];
    rows = rows.map((r: any) => ({
      bitola: validBitolas.includes(r.bitola) ? r.bitola : findClosestBitola(parseFloat(r.bitola) || 10, validBitolas),
      comp: Math.abs(parseFloat(r.comp) || 0),
      q: Math.max(1, Math.round(parseFloat(r.q) || 1)),
    }));

    return new Response(JSON.stringify({ rows }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("extract-table error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function findClosestBitola(value: number, validBitolas: string[]): string {
  let closest = validBitolas[0];
  let minDiff = Infinity;
  for (const b of validBitolas) {
    const diff = Math.abs(value - parseFloat(b));
    if (diff < minDiff) {
      minDiff = diff;
      closest = b;
    }
  }
  return closest;
}
