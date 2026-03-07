import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { text } = await req.json()

        if (!text) {
            return new Response(JSON.stringify({ error: "Text is required" }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            })
        }

        const openAiKey = Deno.env.get('OPENAI_API_KEY')
        if (!openAiKey) {
            return new Response(JSON.stringify({ error: "OPENAI_API_KEY is not configured on the server" }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 500,
            })
        }

        // Call OpenAI Moderation API
        const response = await fetch('https://api.openai.com/v1/moderations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${openAiKey}`
            },
            body: JSON.stringify({ input: text })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error?.message || "Error calling OpenAI API");
        }

        // The moderation API returns a results array
        const result = data.results && data.results[0];

        if (!result) {
            return new Response(JSON.stringify({ flagged: false }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            })
        }

        // Строгие пороги чувствительности (чем меньше значение, тем строже фильтр)
        const strictThresholds: Record<string, number> = {
            'harassment': 0.1,
            'harassment/threatening': 0.1,
            'hate': 0.1,
            'hate/threatening': 0.1,
            'self-harm': 0.1,
            'self-harm/intent': 0.1,
            'self-harm/instructions': 0.1,
            'sexual': 0.3,
            'sexual/minors': 0.1,
            'violence': 0.2,
            'violence/graphic': 0.2
        };

        let isFlagged = result.flagged; // Оставляем базовый флаг OpenAI как страховку

        // Проверяем каждую категорию по нашим строгим порогам
        if (!isFlagged && result.category_scores) {
            for (const [category, score] of Object.entries(result.category_scores)) {
                if (strictThresholds[category] !== undefined && (score as number) > strictThresholds[category]) {
                    isFlagged = true;
                    console.log(`Blocked by custom threshold: ${category} (Score: ${score} > Threshold: ${strictThresholds[category]})`);
                    break;
                }
            }
        }

        if (isFlagged) {
            // Toxic or spam comment
            return new Response(JSON.stringify({ flagged: true, message: "Comment contains inappropriate content" }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            })
        }

        // Clean comment
        return new Response(JSON.stringify({ flagged: false }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })

    } catch (error) {
        return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
