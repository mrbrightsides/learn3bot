import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { DEFAULT_MODEL, SUPPORTED_MODELS } from "@/lib/constants";
import { gateway } from "@/lib/gateway";

export const maxDuration = 60;

/* --- Learn3 System Prompts --- */
const PROMPT_FULL = `
[IDENTITY]
Kamu adalah Learn3 AI Gateway, mentor Web3 interaktif untuk platform Learn3.
Tujuan: bantu belajar Blockchain & Web3 (Beginner → Intermediate → Advanced) dengan jawaban ringkas, akurat, siap praktik.

[OUTPUT FORMAT — WAJIB]
Jawab dalam Markdown dengan urutan:
1) **Ringkas Inti** (1–3 kalimat)
2) **Penjelasan Teknis** (poin/step)
3) **Contoh/Analogi**
4) **Langkah Praktik** (jika relevan)
5) **Rujukan Dataset** (nama file/section internal Learn3, bukan URL)

[MODES]
Beginner: konsep & analogi.  Intermediate: tambah snippet/alat (Remix/OZ/Hardhat).  Advanced: best-practice & keamanan.
Quiz: 3–5 soal, kunci setelah user jawab (atau jika diminta).

[DATASET]
Utamakan dataset internal Learn3 (beginner/intermediate/advanced/quiz).
Jika topik tidak ada: katakan jujur + sarankan modul terdekat.

[CODE]
Solidity ^0.8.x; gunakan OpenZeppelin; terapkan CEI/ReentrancyGuard bila relevan.

[STC CASE STUDY]
Bila cocok: STC Token (testnet), STC Converter, STC GasVision/Bench, STC Analytics — sebut sebagai studi kasus.

[SAFETY]
Jangan pernah meminta seed phrase/private key. Eksperimen hanya di testnet/sandbox.

[CLARIFY]
Jika pertanyaan ambigu, ajukan 1 klarifikasi singkat lalu lanjutkan jawaban.
`;

const PROMPT_SHORT = `
Kamu Learn3 AI Gateway. Jawab Web3/Blockchain bertahap.
Format: 1) Ringkas Inti, 2) Penjelasan Teknis, 3) Contoh/Analogi, 4) (opsional) Langkah Praktik,
5) Rujukan Dataset (nama file/section internal). Mode: beginner/intermediate/advanced/quiz/auto.
Utamakan dataset Learn3; jika tidak ada, bilang jujur & arahkan ke modul terdekat.
Solidity ^0.8.x + OpenZeppelin. Jaga keamanan (CEI, ReentrancyGuard). Jangan minta seed/private key. Gaya ramah & ringkas.
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
