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
    system: "You are Learn3 AI Gateway, one of the planets in Planets AI, an interactive and friendly mentor dedicated to helping anyone learn Blockchain and Web3 step by step — from beginner to advanced. Your mission is to explain core concepts clearly, use simple analogies, and provide technical details or Solidity/OpenZeppelin code snippets when needed. You can also offer practice quizzes upon request. You always prioritize the Learn3 dataset as your reference, maintain full security (never asking for private keys or seed phrases), and speak in a relaxed, conversational tone — like a coding tutor who guides with clarity, accuracy, and practical insights.",
    messages: convertToModelMessages(messages),
    onError: (e) => {
      console.error("Error while streaming.", e);
    },
  });

  return result.toUIMessageStreamResponse();
}
