FROM quay.io/alecmerdler/deno:1.6.2

USER deno

WORKDIR /app
# Cache the dependencies as a layer (the following two steps are re-run only when deps.ts is modified).
# Ideally fetch deps.ts will download and compile _all_ external files used in main.ts.
COPY deps.ts .
RUN deno cache deps.ts
ADD . .
# Compile the main app so that it doesn't need to be compiled each startup/entry.
RUN deno cache app.ts

EXPOSE 3000

CMD ["run", "--allow-net", "--allow-read", "app.ts"]
