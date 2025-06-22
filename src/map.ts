import { makeNoise2D } from "open-simplex-noise";
import { Building } from "./building";
import { Kingdom } from "./kingdom";

export enum Biome {
	Plains,
	Hills,
	River,
	Desert,
	Mountains,
	Forest
}

function biomeColor(biome: Biome) {
	switch (biome) {
		case Biome.Plains: return "#8CD867";
		case Biome.Hills: return "#63A088";
		case Biome.River: return "#55C1FF";
		case Biome.Desert: return "#E1BC29";
		case Biome.Mountains: return "#C2C1C2";
		case Biome.Forest: return "#134611";
	}
}

export enum TileState {
	Undiscovered,
	Visible,
	Discovered,
	Claimed
}

export enum Resource {
	Wood = 'Wood',
	Food = 'Food',
	Stone = 'Stone',
	Population = 'Population',
	Ore = 'Ore'
}

export type Tile = {
	q: number,
	r: number,
	biome: Biome,
	state: TileState
	building: Building | undefined,
	owner: Kingdom | undefined,
	yieldMultipliers: Record<Resource, number>,
};

function createTile(
	q: number,
	r: number,
	biome: Biome,
	state: TileState,
	yieldMultipliers: Record<Resource, number>
): Tile {
	return {
		q, r, biome, state, yieldMultipliers,
		building: undefined,
		owner: undefined,
	}
}

type BiomeMapping = { biome: Biome, values: number[] };
const biomeMap: BiomeMapping[] = [
  { biome: Biome.Plains,    values: [0.45, 0.5] },
  { biome: Biome.Plains,    values: [0.55, 0.45] },
  { biome: Biome.Plains,    values: [0.5, 0.6] },

  { biome: Biome.Hills,     values: [0.65, 0.4] },
  { biome: Biome.Hills,     values: [0.6, 0.55] },

  { biome: Biome.River,     values: [0.3, 0.85] },
  { biome: Biome.River,     values: [0.4, 0.9] },

  // { biome: Biome.Desert,    values: [0.3, 0.1] },
  // { biome: Biome.Desert,    values: [0.2, 0.05] },

  { biome: Biome.Mountains, values: [0.9, 0.4] },
  { biome: Biome.Mountains, values: [0.85, 0.6] },

  { biome: Biome.Forest,    values: [0.45, 0.75] },
  { biome: Biome.Forest,    values: [0.35, 0.65] },
  { biome: Biome.Forest,    values: [0.5, 0.8] },
];

type YieldMultiplier = Partial<Record<Resource, number>>;
type BiomeYieldMap = Record<Biome, YieldMultiplier>;
const yieldMultipliers: BiomeYieldMap = {
	[Biome.Plains]: {
		[Resource.Food]: 1.0,
		[Resource.Wood]: 0.2,
	},
	[Biome.Hills]: {
		[Resource.Food]: 0.8,
		[Resource.Wood]: 0.1,
		[Resource.Stone]: 0.5,
	},
	[Biome.River]: {
		[Resource.Food]: 0.8,
	},
	[Biome.Desert]: {
	},
	[Biome.Mountains]: {
		[Resource.Stone]: 1.0,
		[Resource.Ore]: 1.0,
	},
	[Biome.Forest]: {
		[Resource.Food]: 0.8,
		[Resource.Wood]: 1.0,
	}
};

function euclideanDistanceNDSquared(a: number[], b: number[]) {
	let sum = 0;
	for(let i = 0; i < Math.min(a.length, b.length); i++) {
		const d = a[i] - b[i];
		sum += d*d;
	}
	return sum;
}

function euclideanDistanceND(a: number[], b: number[]) {
	return Math.sqrt(euclideanDistanceNDSquared(a, b));
}

function getBiome(values: number[]): Biome {
	let best: Biome;
	let bestDistance = Infinity;

	for(const map of biomeMap) {
		const distance = euclideanDistanceNDSquared(values, map.values);
		if (distance < bestDistance) {
			best = map.biome;
			bestDistance = distance;
		}
	}

	return best!;
}

export function generateMap(radius: number, scale: number): Tile[] {
	const noise2D = makeNoise2D(Date.now());
	let tiles: Tile[] = [];

	for(let q = -radius; q <= radius; q++) {
		for(let r = -radius; r <= radius; r++) {
			if(Math.abs(q+r) > radius) continue;
			const nx = (q * scale) + 0.5;
			const ny = (r * scale) + 0.5;

			const elevation = (noise2D(nx, ny)+1)/2;
			const moisture = (noise2D(nx+100,ny+100)+1)/2;

			const biome = getBiome([elevation, moisture]);

			const multipliers = yieldMultipliers[biome];

			const tile = createTile(q, r, biome, TileState.Undiscovered, multipliers as Record<Resource, number>);
			tiles.push(tile);

		}
	}

	return tiles;
}

export function hexDistance(q: number, r: number): number {
	const s = -q-r;
	return Math.max(
		Math.abs(q),
		Math.abs(r),
		Math.abs(s)
	);
}

export function pixelToHex(
	x: number,
	y: number,
	size: number, 
): {q: number, r: number} {
	const qf = (2/3 * x) / size;
	const rf = (-1/3 * x + Math.sqrt(3)/3 * y) / size;
	const sf = -qf - rf;

	let rq = Math.round(qf);
	let rr = Math.round(rf);
	let rs = Math.round(sf);

	const qDiff = Math.abs(rq - qf);
	const rDiff = Math.abs(rr - rf);
	const sDiff = Math.abs(rs - sf);

	if (qDiff > rDiff && qDiff > sDiff) {
		rq = -rr - rs;
	} else if (rDiff > sDiff) {
		rr = -rq - rs;
	} else {
		rs = -rq - rr;
	}

	return {q:+rq,r:+rr};
}

export function hexToPixel(q: number, r: number, size: number): {x:number,y:number} {
	const height = Math.sqrt(3) * size;
	const x = q * (size * 1.5);
	const y = height * (r + q/2);
	return { x, y }
}

export function hexCorner(x: number, y: number, size: number, i: number) {
	const angle = (Math.PI / 3) * i;
	return {
		x: x + size * Math.cos(angle),
		y: y + size * Math.sin(angle)
	}
}

function drawHex(
	ctx: CanvasRenderingContext2D,
	x: number,
	y: number,
	size: number,
	stroke?: boolean,
	fill?: boolean,
) {
	ctx.beginPath();
	for(let i = 0; i < 6; i++) {
		const angle = i * Math.PI / 3;
		const px = x + size * Math.cos(angle);
		const py = y + size * Math.sin(angle);

		if(i == 0) ctx.moveTo(px, py);
		else			 ctx.lineTo(px, py);
	}
	ctx.closePath();

	if(fill) ctx.fill();
	if(stroke) ctx.stroke();
}

export function findTile(q: number, r: number, tiles: Tile[]): Tile | undefined {
	return tiles.find(t => t.q == q && t.r == r);
}

export function getTilesInRange(centerQ: number, centerR: number, radius: number): Tile[] {
	const tiles: Tile[] = [];

	for(let dq = -radius; dq <= radius; dq++) {
		for(let dr = -radius; dr <= radius; dr++) {
			if(hexDistance(dq, dr) > radius) continue;
			const q = centerQ + dq;
			const r = centerR + dr;
			const tile = findTile(q, r, tiles);
			if (tile) tiles.push(tile);
		}
	}
		
	return tiles;
}

export function discoverTile(q: number, r: number, tiles: Tile[]) {
	let tile = findTile(q, r, tiles);
	if (tile) tile.state = TileState.Discovered;

	getTilesInRange(q, r, 1).forEach(t => {
		if (t.state == TileState.Undiscovered) t.state = TileState.Visible;
	})
}

export function drawTiles(
	tiles: Tile[],
	size: number,
	ctx: CanvasRenderingContext2D,
) {
		ctx.lineWidth = 2;
		for(const tile of tiles) {
			switch(tile.state) {
				case TileState.Undiscovered: continue;
				case TileState.Visible: ctx.fillStyle = "hsla(0, 0%, 90%, 1)"; break;
				case TileState.Discovered: ctx.fillStyle = biomeColor(tile.biome); break;
				case TileState.Claimed: ctx.fillStyle = biomeColor(tile.biome); break;
			}

			ctx.strokeStyle = "hsl(0, 0%, 5%)";

			const {x, y} = hexToPixel(tile.q, tile.r, size);
			drawHex(ctx, x, y, size, true, true);

			if(tile.building) {
				ctx.fillStyle = "hsl(0, 15%, 40%)";
				ctx.fillRect(x-size/3,y-size/3,size/3*2,size/3*2);
			}
		}
}

export function drawBorder(
	tiles: Tile[],
	size: number,
	ctx: CanvasRenderingContext2D
) {
	const hexDirections = [
		{ dq: +1, dr:  0 },  // right-down
		{ dq:  0, dr: +1 },  // down 
		{ dq: -1, dr: +1 },  // left-down 
		{ dq: -1, dr:  0 },  // left-up 
		{ dq:  0, dr: -1 },  // up 
		{ dq: +1, dr: -1 }   // right-up 
	];

	for(const tile of tiles) {
		const { x, y } = hexToPixel(tile.q, tile.r, size);

		for(let i = 0; i < hexDirections.length; i++) {
			const dir = hexDirections[i];
			const neighbour = findTile(tile.q + dir.dq, tile.r + dir.dr, tiles);
			if (neighbour) continue;

			const a = hexCorner(x, y, size, (i+0)%6);
			const b = hexCorner(x, y, size, (i+1)%6);

			ctx.beginPath();
			ctx.moveTo(a.x, a.y);
			ctx.lineTo(b.x, b.y);
			ctx.stroke();

		}
	}
}

export function drawSelectedTile(
	tile: Tile,
	size: number,
	ctx: CanvasRenderingContext2D
) {
	ctx.lineWidth = 4;
	ctx.strokeStyle = "hsl(0, 0%, 95%)";
	const {x, y} = hexToPixel(tile.q, tile.r, size);
	drawHex(ctx, x, y, size, true);
}
