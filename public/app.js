// TODO(alecmerdler): Implement using TypeScript and a framework...

fetch("/feed", {
  method: "POST",
  headers: { "Content-Type": "application/json", "Accept": "application/json" },
  body: JSON.stringify(),
})
  .then((r) => r.json())
  .then((r) => {
    console.log(r);

    subscribe(r.session);
  });

const subscribe = (uid) => {
  const socket = new WebSocket(`ws://${window.location.host}/feed/${uid}`);

  socket.addEventListener("open", (event) => {
    console.log("Initialized websocket connection");

    const sessionUID = document.querySelector(
      ".sknet-connection-info__session-uid",
    );

    while (sessionUID.firstChild) {
      sessionUID.removeChild(sessionUID.lastChild);
    }

    sessionUID.appendChild(document.createTextNode(`Session ID: ${uid}`));
  });

  socket.addEventListener("message", (event) => {
    console.log("Message from server ", event.data);

    const messagesList = document.querySelector(".skynet-messages-list");
    const row = document.createElement("li");
    row.appendChild(document.createTextNode(event.data));
    messagesList.appendChild(row);
  });

  socket.addEventListener("close", (event) => {
    // TODO(alecmerdler): Retry connection after client loses connection to server...
    console.log("The connection has been closed");
  });

  const sendMessage = (action, data) => {
    socket.send(JSON.stringify({ action, data }));
  };
};
