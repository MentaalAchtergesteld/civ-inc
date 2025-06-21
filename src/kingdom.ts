import { Tile } from "./tiles";

export class Resource {
	constructor(
		public id: string,
		public display: string,
		public amount: number = 0
	) {}

	add(amount: number) { this.amount += amount; }
	sub(amount: number) { this.amount -= amount; }
}

export class Kingdom {
	public resources = new Map<string, Resource>();
	public tiles: Tile[] = [];

	constructor(public name: String) {};

	getResource(id: string): Resource {
		const res = this.resources.get(id);
		if (!res) throw new Error(`Resource ${id} not found`);
		return res;
	}

	addTile(tile: Tile) {
		this.tiles.push(tile);
	}

	getTile(q: number, r: number): Tile | undefined {
		return this.tiles.find(t => t.q == q && t.r == r);
	}

	tick(dt: number) {
		for(const tile of this.tiles) {
			tile.tick(this, dt);
		}
	}
}
