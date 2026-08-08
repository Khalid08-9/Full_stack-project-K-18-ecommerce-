import type { Request, Response, NextFunction } from "express";

/** Reads x-user-id header; responds 401 and stops the chain when missing. */
export function requireUser(req: Request, res: Response, next: NextFunction) {
  const userId = req.header("x-user-id");
  if (!userId) return res.status(401).json({ error: "Not authenticated" });
  req.userId = userId;
  next();
}
