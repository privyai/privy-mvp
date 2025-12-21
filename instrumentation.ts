import { registerOTel } from "@vercel/otel";

export function register() {
  registerOTel({
    serviceName: "privy-ai-coach",
    // Logfire endpoint and headers are configured via environment variables:
    // OTEL_EXPORTER_OTLP_ENDPOINT=https://logfire-api.pydantic.dev
    // OTEL_EXPORTER_OTLP_HEADERS=Authorization=Bearer <your-token>
  });
}
