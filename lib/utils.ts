import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";
import { withFluid } from "@fluid-tailwind/tailwind-merge";
import crypto from "crypto";
import { z } from "zod";

const twMerge = extendTailwindMerge(withFluid);

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getAvatarURL(username: string) {
  return new URL(
    `https://api.dicebear.com/9.x/identicon/svg?seed=${username}&backgroundType=gradientLinear,solid&backgroundRotation=0,360,60,90,120,180,270,-60,-90,-120,-180,-270,-360&backgroundColor=b6e3f4,c0aede,ffd5dc,d1d4f9,ffdfbf`
  ).toString();
}

export async function fetcher<JSON = unknown>(
  input: RequestInfo,
  init?: RequestInit
): Promise<[JSON, number]> {
  try {
    const res = await fetch(input, init);
    const json = await res.json();

    if (!res.ok) {
      const errorMessage =
        json.error || json.error?.message || "An error occurred";
      console.error(`Fetch error: ${errorMessage}`);
      return [{ error: errorMessage } as unknown as JSON, res.status];
    }

    return [json as JSON, res.status];
  } catch (error) {
    console.error("Fetch error:", error);
    return [{ error: "Network error" } as unknown as JSON, 500];
  }
}

export function nFormatter(num: number, digits?: number) {
  if (!num) return "0";
  const lookup = [
    { value: 1, symbol: "" },
    { value: 1e3, symbol: "K" },
    { value: 1e6, symbol: "M" },
    { value: 1e9, symbol: "G" },
    { value: 1e12, symbol: "T" },
    { value: 1e15, symbol: "P" },
    { value: 1e18, symbol: "E" },
  ];
  const rx = /\.0+$|(\.[0-9]*[1-9])0+$/;
  const item = lookup
    .slice()
    .reverse()
    .find((item) => num >= item.value);
  return item
    ? (num / item.value).toFixed(digits || 1).replace(rx, "$1") + item.symbol
    : "0";
}

export function capitalize(str: string) {
  if (!str || typeof str !== "string") return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export const truncate = (str: string, length: number) => {
  if (!str || str.length <= length) return str;
  return `${str.slice(0, length)}...`;
};

export const generateUserHash = (username: string, password: string) => {
  const hashedEmail = crypto.createHash("sha3-256").update(username).digest();
  const hashedPassword = crypto
    .createHash("sha3-256")
    .update(password)
    .digest();

  const salt = process.env.AUTH_SALT || "";

  const hashedData = Buffer.concat([
    hashedEmail,
    hashedPassword,
    Buffer.from(salt),
  ]);

  let userHash = crypto.createHash("sha3-256").update(hashedData).digest("hex");
  // Perform 27 iterations of SHA3-256 hashing
  for (let i = 0; i < 27; i++) {
    userHash = crypto.createHash("sha3-256").update(userHash).digest("hex");
  }

  return userHash;
};

export function validateEmail(email: string): boolean {
  const emailSchema = z.string().email();
  return emailSchema.safeParse(email).success;
}

export function validatePassword(password: string): boolean {
  const passwordSchema = z
    .string()
    .min(8)
    .max(50)
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
    );
  return passwordSchema.safeParse(password).success;
}

export function validateUsername(username: string): boolean {
  const usernameSchema = z
    .string()
    .min(5)
    .max(50)
    .regex(/^[a-zA-Z0-9._]+$/);
  return usernameSchema.safeParse(username).success;
}

export function generateCode(email: string): string {
  const randomCode = crypto.randomBytes(3).toString("hex");
  const hash = crypto.createHash("sha3-256");
  hash.update(email + randomCode);
  return hash.digest("hex").slice(0, 9) + randomCode;
}

export function verifyCode(email: string, code: string): boolean {
  if (code.length !== 15) return false;
  const providedHash = code.slice(0, 9);
  const randomCode = code.slice(9);
  const hash = crypto.createHash("sha3-256");
  hash.update(email + randomCode);
  return hash.digest("hex").slice(0, 9) === providedHash;
}
