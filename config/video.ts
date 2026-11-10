import { createPrivateKey, sign } from "node:crypto";

export type DayId = "1" | "2";

export type VideoDay = {
  id: DayId;
  label: string;
  video: {
    title: string;
    playbackId: string;
    tokens: {
      playback: string;
      thumbnail: string;
      storyboard: string;
    };
  } | null;
};

const idPattern = /^[A-Za-z0-9_-]+$/;
// The two current recordings are roughly eight hours long. Mux requires a token
// to remain valid for playback; the referrer restriction limits where it works.
const tokenLifetimeSeconds = 10 * 60 * 60;

function base64url(value: string | Buffer) {
  return Buffer.from(value).toString("base64url");
}

function createToken(
  playbackId: string,
  audience: "v" | "t" | "s",
  signingKeyId: string,
  privateKey: ReturnType<typeof createPrivateKey>,
  restrictionId: string,
  expiresAt: number,
) {
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT", kid: signingKeyId }));
  const claims = base64url(JSON.stringify({
    sub: playbackId,
    aud: audience,
    exp: expiresAt,
    playback_restriction_id: restrictionId,
  }));
  const input = `${header}.${claims}`;
  const signature = sign("RSA-SHA256", Buffer.from(input), privateKey).toString("base64url");
  return `${input}.${signature}`;
}

function createDay(
  id: DayId,
  value: string | undefined,
  signing: {
    keyId: string;
    privateKey: ReturnType<typeof createPrivateKey>;
    restrictionId: string;
    expiresAt: number;
  } | null,
): VideoDay {
  const playbackId = value?.trim();
  const label = `Day ${id}`;
  if (!playbackId || !idPattern.test(playbackId) || !signing) {
    return { id, label, video: null };
  }

  return {
    id,
    label,
    video: {
      title: `IDSW conference recording — ${label}`,
      playbackId,
      tokens: {
        playback: createToken(playbackId, "v", signing.keyId, signing.privateKey, signing.restrictionId, signing.expiresAt),
        thumbnail: createToken(playbackId, "t", signing.keyId, signing.privateKey, signing.restrictionId, signing.expiresAt),
        storyboard: createToken(playbackId, "s", signing.keyId, signing.privateKey, signing.restrictionId, signing.expiresAt),
      },
    },
  };
}

// Called from the server page after connection(), so values remain server-only.
export function getVideoConfig() {
  const defaultDay: DayId = process.env.DEFAULT_DAY?.trim() === "2" ? "2" : "1";
  const keyId = process.env.MUX_SIGNING_KEY_ID?.trim();
  const privateKeyBase64 = process.env.MUX_SIGNING_PRIVATE_KEY?.trim();
  const restrictionId = process.env.MUX_PLAYBACK_RESTRICTION_ID?.trim();
  let signing = null;
  if (keyId && privateKeyBase64 && restrictionId && idPattern.test(keyId) && idPattern.test(restrictionId)) {
    try {
      signing = {
        keyId,
        privateKey: createPrivateKey(Buffer.from(privateKeyBase64, "base64")),
        restrictionId,
        expiresAt: Math.floor(Date.now() / 1000) + tokenLifetimeSeconds,
      };
    } catch {
      // Invalid private key is treated as unavailable configuration.
    }
  }
  return {
    days: [
      createDay("1", process.env.DAY_1_ID, signing),
      createDay("2", process.env.DAY_2_ID, signing),
    ],
    defaultDay,
  };
}
