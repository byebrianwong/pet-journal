import type { VetVisitMetadata } from '../types/database';

const ANTHROPIC_API_KEY = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY ?? '';

interface ScanResult {
  success: boolean;
  data: VetVisitMetadata & { date?: string; pet_name?: string };
  raw?: string;
}

export async function scanVetReceipt(imageBase64: string): Promise<ScanResult> {
  if (!ANTHROPIC_API_KEY) {
    return { success: false, data: {} };
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: 'image/jpeg',
                  data: imageBase64,
                },
              },
              {
                type: 'text',
                text: `Extract the following from this veterinary receipt and return as JSON only (no markdown, no explanation):
{
  "clinic_name": "string or null",
  "vet_name": "string or null",
  "date": "YYYY-MM-DD or null",
  "pet_name": "string or null",
  "diagnoses": ["array of strings"],
  "medications_prescribed": ["array of strings with dosage"],
  "cost_total": number or null
}
If a field cannot be determined, use null. For arrays, use empty array if none found.`,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      console.warn('Receipt scan API error:', response.status);
      return { success: false, data: {} };
    }

    const result = await response.json();
    const text = result.content?.[0]?.text ?? '';

    // Parse JSON from response, handling potential markdown wrapping
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { success: false, data: {}, raw: text };
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return {
      success: true,
      data: {
        clinic_name: parsed.clinic_name ?? undefined,
        vet_name: parsed.vet_name ?? undefined,
        date: parsed.date ?? undefined,
        pet_name: parsed.pet_name ?? undefined,
        diagnoses: parsed.diagnoses ?? [],
        medications_prescribed: parsed.medications_prescribed ?? [],
        cost_total: parsed.cost_total ?? undefined,
      },
    };
  } catch (err) {
    console.warn('Receipt scan failed:', err);
    return { success: false, data: {} };
  }
}
