import {
  isWebSocketCloseEvent,
  WebSocket,
} from "https://deno.land/std/ws/mod.ts";
import { v4 } from "https://deno.land/std/uuid/mod.ts";
import { Observable } from "https://deno.land/x/observable/mod.ts";
import EventEmitter from "https://deno.land/x/events/mod.ts";

export enum MessageType {
  create = "CREATE",
  update = "UPDATE",
  delete = "DELETE",
}

export type Message = {
  type: MessageType;
  data: string;
};

// FIXME(alecmerdler): Move to a distributed database, this will not scale past single process...
const sources = new Map<string, EventEmitter>();

export const newSession = () => {
  const uid = v4.generate();
  sources.set(uid, new EventEmitter());

  return uid;
};

export const handleConnection = async (uid: string, ws: WebSocket) => {
  console.log(
    JSON.stringify(
      { type: "NewConnection", uid, timestamp: new Date().toISOString() },
    ),
  );

  // TODO(alecmerdler): Send `ping` to client on interval...

  sources.get(uid)?.on("event", async (msg: Message) => {
    console.log(JSON.stringify({ type: "SendingEvent", uid, msg }));

    try {
      await ws.send(JSON.stringify(msg));
    } catch (error) {
      console.log(JSON.stringify({ type: "SendingEventFailed", uid, error }));
    }
  });

  for await (const ev of ws) {
    if (typeof ev === "string") {
      const message = JSON.parse(ev);

      console.log(JSON.stringify({ type: "MessageReceived", uid, message }));
    } else if (isWebSocketCloseEvent(ev)) {
      sources.delete(uid);

      console.log(
        JSON.stringify(
          {
            type: "ClientConnectionClosed",
            uid,
            timestamp: new Date().toISOString(),
          },
        ),
      );
    }
  }
};

export const broadcastEventToAll = (msg: Message) => {
  console.log(JSON.stringify({ type: "BroadcastingEventToAll", msg }));

  for (const [uid] of sources) {
    broadcastEvent(uid, msg);
  }
};

export const broadcastEvent = (uid: string, msg: Message) => {
  console.log(JSON.stringify({ type: "BroadcastingEvent", uid, msg }));

  const source = sources.get(uid);
  if (source === undefined) {
    console.log(JSON.stringify({ type: "BroadcastingEventFailed", uid, msg }));
  } else {
    source.emit("event", msg);
  }
};
