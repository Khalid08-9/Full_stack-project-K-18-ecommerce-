/** Public-safe view of a user — never leak password or verification fields. */
export function toSafeUser(u: {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  emailVerified: boolean;
  password?: string;
  verificationCode?: string | null;
  verificationCodeExpires?: Date | null;
}) {
  const { password: _p, verificationCode: _c, verificationCodeExpires: _e, ...safe } = u;
  return safe;
}

/** Strip password from a full user record (e.g. with addresses). */
export function stripPassword<T extends { password: string }>(user: T) {
  const { password: _p, ...safeUser } = user;
  return safeUser;
}
