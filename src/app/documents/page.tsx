"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const DocumentsPage = () => {
  const [isSending, setIsSending] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async () => {
    setIsSending(true);
    setResult(null);
    setError(null);

    try {
      const res = await fetch("/api/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const body = await res.json();

      if (!res.ok) {
        // Resend returns useful error messages
        const message = body.error || "Failed to send email";
        throw new Error(message);
      }

      setResult("Email sent successfully! Check your inbox.");
      console.log("Success:", body);
    } catch (err: any) {
      const message = err.message || "Network error";
      setError(`Error: ${message}`);
      console.error("Send failed:", err);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="p-6 flex flex-col gap-6 max-w-2xl">
      <h1 className="text-2xl font-bold">Test Email Sending</h1>
      
      <div className="flex items-center gap-4">
        <Button 
          onClick={handleSend} 
          disabled={isSending}
          size="lg"
        >
          {isSending ? "Sending…" : "Send Test Email"}
        </Button>
      </div>

      {result && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
          ✅ {result}
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          ❌ {error}
          <p className="text-xs mt-2 text-red-600">
            Check: API key, verified domain, allowed "from" address
          </p>
        </div>
      )}
    </div>
  );
};

export default DocumentsPage;