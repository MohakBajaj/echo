import { NextResponse, type NextRequest } from "next/server";
import { Resend } from "resend";
import AccountVerificationEmailTemplate from "@/emails";
import { generateCode } from "@/lib/utils";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const resend = new Resend(process.env.RESEND_API_KEY);

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, "1 m"),
});

export async function POST(req: NextRequest) {
  try {
    const ip = req.ip ?? "127.0.0.1";
    const { success } = await ratelimit.limit(ip);

    if (!success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const { email } = await req.json().catch(() => ({}));
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }
    const code = generateCode(email);

    const { data, error } = await resend.emails.send({
      from: "Mohak from Echo <echo@bmohak.codes>",
      to: email,
      subject: "Verify your email address",
      react: AccountVerificationEmailTemplate({ Code: code }),
      text: `Verify Your Email
        ---

        Welcome to Echo! To access our platform and start engaging with the community, please verify your email address by using the provided verification code.

        Verification Code: ${code}

        This code is valid for a limited time and should not be shared with anyone for security reasons.

        Thank you for choosing Echo.`,
    });

    if (error) {
      console.error("Resend API error:", error);
      return NextResponse.json(
        { error: "Failed to send email" },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "Success", data });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
