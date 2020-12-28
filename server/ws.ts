import {
  isWebSocketCloseEvent,
  WebSocket,
} from "https://deno.land/std/ws/mod.ts";
import EventEmitter from "https://deno.land/x/events/mod.ts";

// TODO(alecmerdler): Hide this behind an interface
import { fakeSourceFor, SourceData } from './source.ts';

export enum MessageType {
  create = "CREATE",
  update = "UPDATE",
  delete = "DELETE",
}

export type Message = {
  type: MessageType;
  data: SourceData;
};

/**
 * handleConnection creates a context with the WebSocket connection
 * for a given UID.
 */
export const handleConnection = async (uid: string, ws: WebSocket) => {
  console.log(
    JSON.stringify(
      { type: "NewConnection", uid, timestamp: new Date().toISOString() },
    ),
  );

  const subscription = fakeSourceFor(uid).subscribe(async (data) => {
    const msg: Message = {type: MessageType.create, data};

    console.log(JSON.stringify({ type: "SendingEvent", uid, msg }));

    try {
      await ws.send(JSON.stringify(msg));
    } catch (error) {
      console.log(JSON.stringify({ type: "SendingEventFailed", uid, error }));
    }
  }, (error) => {
    
  }, async () => {
    await ws.close();
  });

  // TODO(alecmerdler): Send `ping` to client on interval...

  for await (const ev of ws) {
    if (typeof ev === "string") {
      const message = JSON.parse(ev);

      console.log(JSON.stringify({ type: "MessageReceived", uid, message }));
    } else if (isWebSocketCloseEvent(ev)) {
      subscription.unsubscribe();

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
