import { Resource, Tile, TileState } from "./map";

export class Kingdom {
	public resources: Record<Resource, number> = {} as Record<Resource, number>; 
	public tiles: Tile[] = [];

	constructor() {
		for (const res of Object.values(Resource)) {
			this.resources[res as Resource] = 0;
		}
	}

	tick(dt: number): void {
		for(const tile of this.tiles) {
			if (tile.building) tile.building.tick(this, dt);
		}
	}
	
	claimTile(tile: Tile): boolean {
		if (tile.state == TileState.Claimed) return false;

		tile.state = TileState.Claimed;
		tile.owner = this;
		this.tiles.push(tile);
		return true;
	}
}
