# Deno Skynet

A scalable websocket service built with Deno.

## Challenges

- Requires a distributed database for storing WebSocket connection state.
- Requires TLS encryption (`https` and `wss`) for baseline security.
- Connection needs to be maintained in event of server disconnect (from normal scaling up/down or outage).
- Monitoring of pod connections to scale up/down based on traffic.
- Annoying OpenShift SCC permissions running container with filesystem access...
- **(Advanced)** Retrieval of missed events for new/reconnecting clients.

## Design

Intended to run on Kubernetes and scale to as many pods as you want. 

- A single `Service` load balances traffic to many pods.
- Each pod runs a single Deno server process. 
- Each Deno server process can handle several WebSocket connections.

### Establishing a Connection

1. Client creates a WebSocket connection session to a resource:
```
POST https://<hostname>/feed
{"session": <some-uuid>}
```

2. Client establishes WebSocket connection to a resource using given session UID:
```
wss://<hostname>/feed/<some-uuid>
```

3. Client receives events from WebSocket:
```
{"type": "CREATE", "data": "blue"}
```

4. Client deletes WebSocket session when finished:
```
DELETE https://<hostname>/feed/<some-uuid>
```
