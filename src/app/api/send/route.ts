// app/api/send/route.ts
import { Resend } from "resend";
import { EmailTemplate } from "@/components/EmailTemplate";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST() {
  // Basic validation
  if (!process.env.RESEND_API_KEY) {
    return Response.json(
      { error: "RESEND_API_KEY not configured" },
      { status: 500 }
    );
  }

  try {
    const { data, error } = await resend.emails.send({
      from: "Sathyam <onboarding@resend.dev>", // Must be verified in Resend dashboard
      to: ["sathyamrock55@gmail.com"],
      subject: "Hello from EasySign!",
      react: EmailTemplate({ firstName: "Sathyam" }),
    });

    if (error) {
      console.error("Resend error:", error);
      return Response.json(
        { 
          error: error.message || "Failed to send email",
          name: error.name 
        },
        { status: 400 } // Use 400 for client errors (auth, domain, etc.)
      );
    }

    console.log("Email sent successfully:", data);
    return Response.json({ success: true, data });
  } catch (error: any) {
    console.error("Unexpected error sending email:", error);
    return Response.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}