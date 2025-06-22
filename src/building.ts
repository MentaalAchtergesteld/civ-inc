import { Kingdom } from "./kingdom";
import { Biome, Resource, Tile } from "./map";

export type Building = {
	name: string,
	allowedBiomes: Biome[],
	input: Partial<Record<Resource, number>>,
	output: Partial<Record<Resource, number>>;
	productivity: number,
}

export function collectBuilding(kingdom: Kingdom, tile: Tile, dt: number): number {
	if (tile.building == undefined) return 0;
	const building = tile.building;

	// Check if required resources are present
	for(const [res, amount] of Object.entries(building.input)) {
		if((kingdom.resources[res as Resource] ?? 0) < amount * dt) {
			return 0; 
		}
	}

	// Subtract used resources	
	for(const [res, amount] of Object.entries(building.input)) {
		kingdom.resources[res as Resource] -= amount * dt;
	}

	// Add produced resources
	let totalMaxProduced = 0;
	let totalProduced = 0;
	for(const [res, amount] of Object.entries(building.output)) {
		totalMaxProduced += amount * dt;
		let produced = amount * dt * (tile.yieldMultipliers[res as Resource] || 0);
		kingdom.resources[res as Resource] += produced;
		totalProduced += produced;
	}

	let productivity = totalProduced / totalMaxProduced;
	building.productivity = productivity;

	return productivity;
}

export function createFarm(): Building {
	return {
		name: "Farm",
		allowedBiomes: [Biome.Plains],
		input: {},
		output: { [Resource.Food]: 1 },
		productivity: 0,
	};
}

export const buildings = [
	createFarm(),
];
