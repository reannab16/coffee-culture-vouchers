import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
export const COOKIE_NAME = "merchant_session";

export type MerchantPayload = { cafeId: string; slug: string };

export async function setMerchantSession(payload: MerchantPayload, hours = 12) {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${hours}h`)
    .sign(secret);

  const cookieStore = await cookies(); // <-- await
  cookieStore.set({
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * hours,
  });
}

export async function getMerchantSession(): Promise<MerchantPayload | null> {
  const cookieStore = await cookies(); // <-- await
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as MerchantPayload;
  } catch {
    return null;
  }
}

export async function clearMerchantSession() {
  const cookieStore = await cookies(); // <-- await
  cookieStore.set({ name: COOKIE_NAME, value: "", path: "/", maxAge: 0 });
}