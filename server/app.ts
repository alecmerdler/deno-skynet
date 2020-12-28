import { serve } from "https://deno.land/std/http/server.ts";
import { acceptable, acceptWebSocket } from "https://deno.land/std/ws/mod.ts";
import { v4 } from "https://deno.land/std/uuid/mod.ts";

import {
  handleConnection,
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
        body: await Deno.open("./frontend/index.html"),
      });
    } else if (req.url.startsWith("/frontend/")) {
      req.respond({
        status: 200,
        headers: new Headers({'Content-Type': 'text/javascript'}),
        body: await Deno.open(".".concat(req.url)),
      });
    } else if (req.url === "/feed") {
      switch (req.method) {
        case "POST":
          req.respond({
            status: 201,
            body: JSON.stringify({ session: v4.generate() }),
          });
          break;
        case "DELETE":
          break;
        default:
          req.respond({ status: 405 });
      }
    } else if (
      // FIXME(alecmerdler): What happens if we receive a request for a WebSocket UID that was created from another server node...?
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
