// Cola aleatoria ponderada para el reproductor. Sin dependencias: corre en la TV.
//  - ~40% reels, ~35% comerciales generados, ~25% anuncios manuales (largo plazo).
//  - Nunca dos ítems seguidos del mismo tipo (si hay más de un tipo disponible).
//  - Dentro de cada tipo, "bolsa barajada": no se repite un ítem hasta agotar los demás.
//  - Cada ítem puede traer `weight` (por defecto 1): en cada vuelta de la bolsa aparece ~weight veces.
//    Así se segmenta por franja horaria (más programas infantiles a la salida de escuelas, etc.).

export type MediaType = "reel" | "commercial" | "manual";

export const TYPE_WEIGHTS: Record<MediaType, number> = { reel: 0.4, commercial: 0.35, manual: 0.25 };
const TYPES: MediaType[] = ["reel", "commercial", "manual"];

type Rand = () => number;
export interface QueueItem {
  id: string;
  weight?: number;
}

class ShuffleBag<T extends QueueItem> {
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

  /** Copias por vuelta según el peso: 1.6 → 1 copia segura + 60 % de probabilidad de una segunda. */
  private copies(item: T): number {
    const w = Math.max(0, Math.min(4, item.weight === undefined ? 1 : item.weight));
    const whole = Math.floor(w);
    return whole + (this.rand() < w - whole ? 1 : 0);
  }

  private refill(): void {
    let bag: T[] = [];
    for (const item of this.items) for (let k = this.copies(item); k > 0; k--) bag.push(item);
    if (!bag.length) bag = this.items.slice(); // nadie se queda fuera para siempre
    for (let i = bag.length - 1; i > 0; i--) {
      const j = Math.floor(this.rand() * (i + 1));
      const t = bag[i];
      bag[i] = bag[j];
      bag[j] = t;
    }
    // Separa copias contiguas del mismo ítem (y del último que salió).
    for (let i = 0; i < bag.length; i++) {
      const prev = i === 0 ? this.lastId : bag[i - 1].id;
      if (bag[i].id !== prev) continue;
      for (let j = i + 1; j < bag.length; j++) {
        if (bag[j].id !== prev && (j + 1 >= bag.length || bag[j + 1].id !== bag[i].id) && (j === 0 || bag[j - 1].id !== bag[i].id)) {
          const t = bag[i];
          bag[i] = bag[j];
          bag[j] = t;
          break;
        }
      }
    }
    this.bag = bag;
  }

  next(): T | null {
    if (!this.items.length) return null;
    if (!this.bag.length) this.refill();
    // Nunca el mismo ítem dos veces seguidas (si hay otro disponible).
    let idx = 0;
    if (this.items.length > 1 && this.bag[0].id === this.lastId) {
      idx = this.bag.findIndex((x) => x.id !== this.lastId);
      if (idx < 0) {
        this.refill();
        idx = Math.max(0, this.bag.findIndex((x) => x.id !== this.lastId));
      }
    }
    const item = this.bag.splice(idx, 1)[0];
    this.lastId = item.id;
    return item;
  }
}

export class WeightedQueue<R extends QueueItem, C extends QueueItem, M extends QueueItem> {
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
