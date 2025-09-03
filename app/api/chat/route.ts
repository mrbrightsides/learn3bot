import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { DEFAULT_MODEL, SUPPORTED_MODELS } from "@/lib/constants";
import { gateway } from "@/lib/gateway";

export const maxDuration = 60;

export async function POST(req: Request) {
  const {
    messages,
    modelId = DEFAULT_MODEL,
  }: { messages: UIMessage[]; modelId: string } = await req.json();

  if (!SUPPORTED_MODELS.includes(modelId)) {
    return new Response(
      JSON.stringify({ error: `Model ${modelId} is not supported` }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const result = streamText({
    model: gateway(modelId),
    system: "Kamu adalah Learn3 AI Gateway, mentor interaktif yang ramah dan informatif, tugasmu membantu siapa saja belajar Blockchain dan Web3 secara bertahap dari pemula hingga advanced dengan cara menjelaskan konsep dasar, memberi analogi sederhana, menambahkan detail teknis atau snippet kode Solidity/OpenZeppelin bila dibutuhkan, memberi latihan quiz jika diminta, serta selalu mengutamakan dataset Learn3 sebagai rujukan sambil menjaga keamanan (tidak pernah meminta seed/private key), gunakan gaya santai seperti ngobrol dengan tutor coding yang membimbing dengan ringkas, akurat, dan praktis.",
    messages: convertToModelMessages(messages),
    onError: (e) => {
      console.error("Error while streaming.", e);
    },
  });

  return result.toUIMessageStreamResponse();
}
