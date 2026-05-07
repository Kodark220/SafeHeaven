import type { NextFunction, Request, Response } from "express";

import { verifyWalletToken } from "./arc.js";

export interface AuthenticatedRequest extends Request {
  auth?: {
    address: string;
    chainId: number;
    actorId?: string | null;
  };
}

export function requireAuth(request: AuthenticatedRequest, response: Response, next: NextFunction) {
  const header = request.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    response.status(401).json({ message: "Missing bearer token." });
    return;
  }

  try {
    request.auth = verifyWalletToken(header.replace("Bearer ", ""));
    next();
  } catch {
    response.status(401).json({ message: "Invalid or expired token." });
  }
}
