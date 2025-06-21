import { hexToPixel } from "./hexgrid";
import { Kingdom } from "./kingdom";

interface BuildingEffect {
	applyEffect(kingdom: Kingdom, dt: number): void;
}

export abstract class Building implements BuildingEffect {
	constructor(public name: string) {}
	abstract applyEffect(kingdom: Kingdom, dt: number): void;
}

export class Farm extends Building {
	constructor() { super("Farm"); }

	applyEffect(kingdom: Kingdom, dt: number): void {
	    const food = kingdom.getResource("food");
			food.add(1 * dt);
	}
}

export class Lumbermill extends Building {
	constructor() { super("Lumbermill"); }

	applyEffect(kingdom: Kingdom, dt: number): void {
	    const wood = kingdom.getResource("wood");
			wood.add(.5 * dt);
	}
}

export class Mine extends Building {
	constructor() { super("Mine"); }

	applyEffect(kingdom: Kingdom, dt: number): void {
	    const stone = kingdom.getResource("stone");
			stone.add(.5 * dt);
	}
}

export class House extends Building {
	constructor() { super("House"); }

	applyEffect(kingdom: Kingdom, dt: number): void {
	    const pop = kingdom.getResource("population");
			pop.add(.1 * dt);
	}
}


export enum TileType {
	Plains = "Plains",
	Forest = "Forest",
	Fields = "Fields",
	Mountains = "Mountains",
}

export const tileColors: Record<TileType, string> = {
  [TileType.Plains]:  '#a7d37c',  // bijvoorbeeld lichtgroen
  [TileType.Forest]:  '#228b22',  // donkergroen
  [TileType.Mountains]:'#888888',  // grijs
  [TileType.Fields]:  '#f5e050'   // geel
};

export type TileDistribution = Record<TileType, number>
export function randomTileDistribution(): TileDistribution {
	const keys = Object.keys(TileType)
		.filter(k => isNaN(Number(k))) as (keyof typeof TileType)[];

	const vals = keys.map(_ => Math.random());
	const sum = vals.reduce((a, b)=>a+b, 0);
	return keys.reduce((o, k, i) => ( o[k] = vals[i]/sum, o ), {} as any);
}

export function drawDistributionPieChart(x: number, y:number, size: number, distribution: TileDistribution, ctx: CanvasRenderingContext2D) {
	let startAngle = -Math.PI/2;

	for(const key in distribution) {
		const type = key as TileType;

		const percentage = distribution[type as TileType];
		if (percentage <= 0) continue;
		
		const sliceAngle = percentage * Math.PI * 2;
		ctx.beginPath();
		ctx.moveTo(x, y);
		ctx.arc(x, y, size, startAngle, startAngle + sliceAngle);
		ctx.closePath();

		ctx.fillStyle = tileColors[type];
		ctx.fill();

		startAngle += sliceAngle;
	}
}

export class Tile {
	buildings: Building[] = [];

	constructor(
		public q: number,
		public r: number,
		public typeDistribution: TileDistribution,
		buildingSlots: number,
	) {
		this.buildings = new Array(buildingSlots).fill(null);
	}

	addBuilding(building: Building): boolean {
		let i = this.buildings.findIndex((b) => b == null);
		if (i == undefined) return false;
		this.buildings[i] = building;
		return true;
	}

	tick(kingdom: Kingdom, dt: number) {
		for (const b of this.buildings) {
			if (b == null) continue;
			b.applyEffect(kingdom, dt);
		}
	}

	draw(ctx: CanvasRenderingContext2D, size: number, selected: boolean = false) {
		const { x, y } = hexToPixel({ q: this.q, r: this.r }, size); 

		ctx.beginPath();
		for (let i = 0; i < 6; i++) {
			const angle = Math.PI / 3 * i + Math.PI / 6;
			const px = x + size * 0.95 * Math.cos(angle);
			const py = y + size * 0.95 * Math.sin(angle);
			i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
		}
		ctx.closePath();

		ctx.save();
		ctx.clip();

		drawDistributionPieChart(x, y, size, this.typeDistribution, ctx);	

		ctx.restore();

		ctx.beginPath();
		for(let i = 0; i < 6; i++) {
			const angle = Math.PI/3 * i + Math.PI/6;
			const xi = x + size * Math.cos(angle);
			const yi = y + size * Math.sin(angle);

			i == 0 ? ctx.moveTo(xi, yi) : ctx.lineTo(xi, yi);
		}
		ctx.closePath();

		if (selected) {
			ctx.strokeStyle = "#E3E3E3";
			ctx.lineWidth = 4;
			ctx.stroke();
		} else {
			ctx.strokeStyle = "#333";
			ctx.lineWidth = 4;
		}

	}
}
