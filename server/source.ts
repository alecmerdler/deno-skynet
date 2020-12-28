import { Observable } from "https://deno.land/x/observable/mod.ts";

export type Status = "online" | "offline";
export type SourceData = {
  status: Status;
};

export type SourceFor = (uid: string) => Observable<SourceData>;

export const fakeSourceFor: SourceFor = (uid) => {
  const intervalTime = 500;
  const url = 'https://gist.githubusercontent.com/alecmerdler/49b6757f99204979ff8352a61b12c81b/raw/06540c76560aa9601817cd8f365c58cb06b694aa/source.json';

  // FIXME(alecmerdler): Inefficient to create a new Observable for each subscriber...
  return new Observable<SourceData>((observer) => {
    const fetchInterval = setInterval(async() => {
      try {
        const response = await fetch(url);

        if (response.status !== 200) {
          observer.error(response.statusText);
          clearInterval(fetchInterval);
        } else {
          const data: SourceData = await response.json();
          observer.next(data);
        }
      } catch (error) {
        observer.error(error);
        clearInterval(fetchInterval);
      }

      if (observer.closed) {
        clearInterval();
      }
    }, intervalTime);
  });
};
