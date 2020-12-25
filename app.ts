import { serve } from "https://deno.land/std/http/server.ts";
import { acceptable, acceptWebSocket } from "https://deno.land/std/ws/mod.ts";

import {
  broadcastEvent,
  broadcastEventToAll,
  handleConnection,
  MessageType,
  newSession,
} from "./ws.ts";

if (import.meta.main) {
  const port = 3000;
  const server = serve({ port });

  console.log(`
  ########################################
  #       Deno Skynet Initiated          #
  #       Running on port ${port}           #
  ########################################
  `.replaceAll("\n  ", "\n"));

  // FIXME(alecmerdler): Debugging by randomly firing events to clients...
  setInterval(() => {
    broadcastEventToAll({ type: MessageType.create, data: "blue" });
  }, 500);

  for await (const req of server) {
    console.log(
      JSON.stringify(
        {
          method: req.method,
          url: req.url,
          timestamp: new Date().toISOString(),
        },
      ),
    );

    if (req.url === "/") {
      req.respond({
        status: 200,
        body: await Deno.open("./public/index.html"),
      });
    } else if (req.url.startsWith("/public/")) {
      req.respond({
        status: 200,
        body: await Deno.open(".".concat(req.url)),
      });
    } else if (req.url === "/feed") {
      if (!["POST", "DELETE"].includes(req.method)) {
        req.respond({ status: 405 });
      } else {
        const uid = newSession();

        req.respond({
          status: 201,
          body: JSON.stringify({ session: uid }),
        });
      }
    } else if (
      req.url.startsWith("/feed/") && req.url.split("/feed/").length === 2
    ) {
      if (acceptable(req)) {
        const uid = req.url.split("/feed/")[1];

        acceptWebSocket({
          conn: req.conn,
          bufReader: req.r,
          bufWriter: req.w,
          headers: req.headers,
        })
          .then((ws) => handleConnection(uid, ws));
      }
    } else {
      req.respond({
        status: 404,
      });
    }
  }
}
