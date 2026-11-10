import "server-only";
import { createPrivateKey } from "node:crypto";
import { SignJWT } from "jose";
import { integer, pem, required } from "../config/server";
import type { Playback } from "../auth/service";

export async function signPlayback(day: 1 | 2): Promise<Playback> {
  const playbackId = required(
    day === 1 ? "DAY_1_ID" : "DAY_2_ID",
  );
  const kid = required("MUX_SIGNING_KEY_ID");
  const restriction = required("MUX_PLAYBACK_RESTRICTION_ID");
  const key = createPrivateKey(pem(required("MUX_SIGNING_PRIVATE_KEY")));
  const expiration =
    Math.floor(Date.now() / 1000) +
    integer("MUX_TOKEN_EXPIRATION_SECONDS", 600, 120, 1800);
  const sign = (audience: string) =>
    new SignJWT({ playback_restriction_id: restriction })
      .setProtectedHeader({ alg: "RS256", kid })
      .setSubject(playbackId)
      .setAudience(audience)
      .setIssuedAt()
      .setExpirationTime(expiration)
      .sign(key);
  const [playback, thumbnail, storyboard] = await Promise.all([
    sign("v"),
    sign("t"),
    sign("s"),
  ]);
  return {
    playbackId,
    tokens: { playback, thumbnail, storyboard },
    expiresAt: expiration * 1000,
  };
}
