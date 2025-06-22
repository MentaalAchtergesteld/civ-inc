import { Kingdom } from "./kingdom";
import { Resource } from "./map";

export abstract class Building {
	constructor(public name: string){};
	abstract tick(kingdom: Kingdom, dt: number): void;
	abstract getProduction(): Partial<Record<Resource, number>>
}

export class Farm extends Building {
	private foodProduction = 1;
	constructor() { super("Farm") };
	
	tick(kingdom: Kingdom, dt: number): void {
		kingdom.resources.Food += this.foodProduction * dt; 
	}

	getProduction(): Partial<Record<Resource, number>> {
		return {[Resource.Food]:this.foodProduction};
	}
}
