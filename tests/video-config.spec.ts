import { generateKeyPairSync, verify } from "node:crypto";
import { expect, test } from "@playwright/test";
import { getVideoConfig } from "../config/video";

const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
const signingKey = Buffer.from(privateKey.export({ type: "pkcs8", format: "pem" })).toString("base64");
const keys = [
  "DAY_1_ID", "DAY_2_ID", "DEFAULT_DAY",
  "MUX_SIGNING_KEY_ID", "MUX_SIGNING_PRIVATE_KEY", "MUX_PLAYBACK_RESTRICTION_ID",
] as const;

function withEnv(values: Partial<Record<(typeof keys)[number], string>>, run: () => void) {
  const previous = keys.map((key) => process.env[key]);
  try {
    keys.forEach((key) => delete process.env[key]);
    for (const [key, value] of Object.entries(values)) process.env[key] = value;
    run();
  } finally {
    keys.forEach((key, index) => {
      if (previous[index] === undefined) delete process.env[key];
      else process.env[key] = previous[index];
    });
  }
}

test("missing or malformed signing configuration never creates a player", () => {
  withEnv({ DAY_1_ID: "play-1", DAY_2_ID: "play-2", DEFAULT_DAY: "3" }, () => {
    const config = getVideoConfig();
    expect(config.defaultDay).toBe("1");
    expect(config.days.every((day) => day.video === null)).toBe(true);
  });
  withEnv({
    DAY_1_ID: "https://player.mux.com/play-1",
    DAY_2_ID: "play-2",
    MUX_SIGNING_KEY_ID: "key-1",
    MUX_SIGNING_PRIVATE_KEY: "invalid",
    MUX_PLAYBACK_RESTRICTION_ID: "restriction-1",
  }, () => {
    expect(getVideoConfig().days.every((day) => day.video === null)).toBe(true);
  });
});

test("creates valid, restricted RS256 tokens for each Mux resource", () => {
  withEnv({
    DAY_1_ID: "play-1",
    DAY_2_ID: "play-2",
    MUX_SIGNING_KEY_ID: "key-1",
    MUX_SIGNING_PRIVATE_KEY: signingKey,
    MUX_PLAYBACK_RESTRICTION_ID: "restriction-1",
  }, () => {
    const config = getVideoConfig();
    expect(config.days.map((day) => day.video?.playbackId)).toEqual(["play-1", "play-2"]);
    const tokens = config.days[0].video!.tokens;
    for (const [resource, audience] of [
      ["playback", "v"], ["thumbnail", "t"], ["storyboard", "s"],
    ] as const) {
      const [header, payload, signature] = tokens[resource].split(".");
      expect(JSON.parse(Buffer.from(header, "base64url").toString())).toMatchObject({
        alg: "RS256", kid: "key-1",
      });
      const claims = JSON.parse(Buffer.from(payload, "base64url").toString());
      expect(claims).toMatchObject({
        sub: "play-1", aud: audience, playback_restriction_id: "restriction-1",
      });
      expect(claims.exp).toBeGreaterThan(Math.floor(Date.now() / 1000) + 9 * 60 * 60);
      expect(verify("RSA-SHA256", Buffer.from(`${header}.${payload}`), publicKey,
        Buffer.from(signature, "base64url"))).toBe(true);
    }
  });
});
