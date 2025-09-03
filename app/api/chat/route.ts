import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { DEFAULT_MODEL, SUPPORTED_MODELS } from "@/lib/constants";
import { gateway } from "@/lib/gateway";

export const maxDuration = 60;

/* --- Learn3 System Prompts --- */
const SYSTEM_PROMPT = `
Kamu adalah Learn3 AI Gateway — mentor interaktif Blockchain & Web3.
Tugasmu: bantu user belajar secara bertahap dari level pemula sampai advanced.
Jangan kaku, gunakan bahasa ramah dan mengalir, seperti ngobrol dengan mentor/tutor.

Gaya jawaban:
- Mulai dengan jawaban langsung ke pertanyaan user.
- Jelaskan dengan cara sederhana dulu, lalu tambah detail teknis bila perlu.
- Jika topiknya beginner → pakai analogi sederhana.
- Jika intermediate → sertakan langkah praktik atau snippet singkat.
- Jika advanced → fokus pada best practice, keamanan, tren terbaru.
- Untuk quiz → berikan 3–5 pertanyaan latihan, tunggu jawaban user sebelum kasih kunci.

Ingat:
- Utamakan materi dari dataset Learn3. 
- Kalau tidak ada di dataset, katakan jujur dan arahkan ke modul terdekat.
- Gunakan Solidity ^0.8.x dengan OpenZeppelin untuk contoh kode.
- Jangan pernah minta seed phrase atau private key.

Gaya kamu seperti mentor coding Web3 yang ramah, ringkas, tapi tetap teknis ketika dibutuhkan.
`;

const SYSTEM_BY_LEVEL: Record<string, string> = {
  auto: PROMPT_FULL,
  beginner: PROMPT_SHORT + "\nMode paksa: Beginner.",
  intermediate: PROMPT_SHORT + "\nMode paksa: Intermediate.",
  advanced: PROMPT_SHORT + "\nMode paksa: Advanced.",
  quiz: PROMPT_SHORT + "\nMode paksa: Quiz (beri 3–5 soal, tunda kunci hingga user menjawab).",
};

export async function POST(req: Request) {
  const {
    messages,
    modelId = DEFAULT_MODEL,
    level = "auto", // <-- param opsional dari UI
  }: { messages: UIMessage[]; modelId: string; level?: keyof typeof SYSTEM_BY_LEVEL } =
    await req.json();

  if (!SUPPORTED_MODELS.includes(modelId)) {
    return new Response(
      JSON.stringify({ error: `Model ${modelId} is not supported` }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const system = SYSTEM_BY_LEVEL[level ?? "auto"] ?? SYSTEM_BY_LEVEL.auto;

  const result = streamText({
    model: gateway(modelId),
    system,
    messages: convertToModelMessages(messages),
    onError: (e) => {
      console.error("Error while streaming.", e);
    },
  });

  return result.toUIMessageStreamResponse();
}
