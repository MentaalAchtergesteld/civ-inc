import { collectBuilding } from "./building";
import { Resource, Tile, TileState } from "./map";

export type Kingdom = {
	name: string,
	resources: Record<Resource, number>,
	tiles: Tile[]
}

export function createKingdom(name: string): Kingdom {
	const keys = Object.values(Resource) as Resource[];
	const resources = Object.fromEntries(keys.map(r => [r, 0])) as Record<Resource, number>;

	return {
		name,
		resources,
		tiles: [],
	}
}

export function tickKingdom(kingdom: Kingdom, dt: number): void {
	for(const tile of kingdom.tiles) {
		if (tile.building) collectBuilding(kingdom, tile, dt);
	}
}

export function claimTile(kingdom: Kingdom, tile: Tile): boolean {
	if (tile.state == TileState.Claimed || tile.owner != undefined) return false;

	tile.state = TileState.Claimed;
	tile.owner = kingdom;
	kingdom.tiles.push(tile);
	return true;
}
