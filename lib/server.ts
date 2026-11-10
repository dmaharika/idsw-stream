import "server-only";
import { AuthService } from "./auth/service";
import { authConfig, required } from "./config/server";
import { sheetsLookup } from "./google-sheets/client";
import { signPlayback } from "./mux/sign";
import { sendCode } from "./resend/client";
import { RedisStore, restCommand } from "./store/redis";

let instance: AuthService | undefined;
export function auth() {
  if (!instance) {
    const store = new RedisStore(
      restCommand(
        required("UPSTASH_REDIS_REST_URL"),
        required("UPSTASH_REDIS_REST_TOKEN"),
      ),
    );
    instance = new AuthService({
      store,
      config: authConfig(),
      lookup: sheetsLookup(store),
      sendCode,
      signPlayback,
    });
  }
  return instance;
}
