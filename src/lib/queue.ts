// Cola aleatoria ponderada para el reproductor. Sin dependencias: corre en la TV.
//  - ~40% reels, ~35% comerciales generados, ~25% anuncios manuales (largo plazo).
//  - Nunca dos ítems seguidos del mismo tipo (si hay más de un tipo disponible).
//  - Dentro de cada tipo, "bolsa barajada": no se repite un ítem hasta agotar los demás.

export type MediaType = "reel" | "commercial" | "manual";

export const TYPE_WEIGHTS: Record<MediaType, number> = { reel: 0.4, commercial: 0.35, manual: 0.25 };
const TYPES: MediaType[] = ["reel", "commercial", "manual"];

type Rand = () => number;

class ShuffleBag<T extends { id: string }> {
  private items: T[] = [];
  private bag: T[] = [];
  private lastId: string | null = null;

  constructor(private rand: Rand) {}

  get size(): number {
    return this.items.length;
  }

  /** Actualiza los ítems conservando el orden pendiente de los que siguen existiendo. */
  set(items: T[]): void {
    const byId = new Map(items.map((i) => [i.id, i]));
    this.items = items.slice();
    this.bag = this.bag.filter((i) => byId.has(i.id)).map((i) => byId.get(i.id) as T);
    const pending = new Set(this.bag.map((i) => i.id));
    const fresh = items.filter((i) => !pending.has(i.id) && i.id !== this.lastId);
    // Los nuevos entran en posiciones aleatorias de la bolsa actual.
    for (const item of fresh) this.bag.splice(Math.floor(this.rand() * (this.bag.length + 1)), 0, item);
  }

  next(): T | null {
    if (!this.items.length) return null;
    if (!this.bag.length) {
      this.bag = this.items.slice();
      for (let i = this.bag.length - 1; i > 0; i--) {
        const j = Math.floor(this.rand() * (i + 1));
        const t = this.bag[i];
        this.bag[i] = this.bag[j];
        this.bag[j] = t;
      }
      // Evita repetir en la frontera entre dos bolsas.
      if (this.bag.length > 1 && this.bag[0].id === this.lastId) {
        const t = this.bag[0];
        this.bag[0] = this.bag[1];
        this.bag[1] = t;
      }
    }
    const item = this.bag.shift() as T;
    this.lastId = item.id;
    return item;
  }
}

export class WeightedQueue<R extends { id: string }, C extends { id: string }, M extends { id: string }> {
  private bags: { reel: ShuffleBag<R>; commercial: ShuffleBag<C>; manual: ShuffleBag<M> };
  private credit: Record<MediaType, number> = { reel: 0, commercial: 0, manual: 0 };
  private lastType: MediaType | null = null;

  constructor(private rand: Rand = Math.random) {
    this.bags = { reel: new ShuffleBag<R>(rand), commercial: new ShuffleBag<C>(rand), manual: new ShuffleBag<M>(rand) };
  }

  setSources(sources: { reel: R[]; commercial: C[]; manual: M[] }): void {
    this.bags.reel.set(sources.reel);
    this.bags.commercial.set(sources.commercial);
    this.bags.manual.set(sources.manual);
  }

  get isEmpty(): boolean {
    return TYPES.every((t) => this.bags[t].size === 0);
  }

  next(): { type: "reel"; item: R } | { type: "commercial"; item: C } | { type: "manual"; item: M } | null {
    const available = TYPES.filter((t) => this.bags[t].size > 0);
    if (!available.length) return null;

    const total = available.reduce((s, t) => s + TYPE_WEIGHTS[t], 0);
    // "Smooth weighted round-robin" con ruido: respeta las proporciones a largo plazo sin ser predecible.
    for (const t of available) this.credit[t] += (TYPE_WEIGHTS[t] / total) * (0.6 + 0.8 * this.rand());
    for (const t of TYPES) if (!available.includes(t)) this.credit[t] = 0;

    const candidates = available.length > 1 ? available.filter((t) => t !== this.lastType) : available;
    let chosen = candidates[0];
    for (const t of candidates) if (this.credit[t] > this.credit[chosen]) chosen = t;
    this.credit[chosen] -= 1;
    this.lastType = chosen;

    if (chosen === "reel") return { type: "reel", item: this.bags.reel.next() as R };
    if (chosen === "commercial") return { type: "commercial", item: this.bags.commercial.next() as C };
    return { type: "manual", item: this.bags.manual.next() as M };
  }
}
