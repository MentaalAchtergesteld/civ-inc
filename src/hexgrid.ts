export interface Hex { q: number; r: number; }

export function getHexesInRadius(radius: number): Hex[] {
	const out: Hex[] = [];
	for(let q = -radius; q <= radius; q++) {
		const r1 = Math.max(-radius, -q - radius);
		const r2 = Math.min( radius, -q + radius);
		for (let r = r1; r <= r2; r++) {
			out.push({ q, r });
		}
	}
	return out;
}

export interface Coordinate { x: number; y: number; }

export function hexToPixel(h: Hex, size: number): Coordinate {
		const x = size * (Math.sqrt(3) * h.q + Math.sqrt(3)/2 * h.r);
		const y = size * (3/2 * h.r);
		return { x, y }
}

export function pixelToHex(coord: Coordinate, size: number): Hex {
	const qf = (Math.sqrt(3)/3 * coord.x - 1/3 * coord.y) / size;
	const rf = (2/3*coord.y) / size;
	const sf = -qf-rf;

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

  if (rq === 0) rq = 0;
  if (rr === 0) rr = 0;

	return { q: rq, r: rr } 
}
