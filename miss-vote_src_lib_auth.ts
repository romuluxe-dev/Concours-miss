import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "change-moi-en-production";

export function signAdminToken(adminId: string) {
  return jwt.sign({ adminId }, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyAdminToken(token: string): { adminId: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { adminId: string };
  } catch {
    return null;
  }
}
