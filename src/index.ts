import { renderTiles, tilesCanvas, tileSize } from "./canvas";
import { getHexesInRadius, pixelToHex } from "./hexgrid";
import { Kingdom, Resource } from "./kingdom";
import { KingdomPanel, Panel, PanelSide, TileInfoPanel } from "./panels";
import { Farm, randomTileDistribution, Tile, tileColors, TileType } from "./tiles";

function createResources(kingdom: Kingdom) {
	kingdom.resources.set("food", 			new Resource("food", "Food"));
	kingdom.resources.set("wood", 			new Resource("wood", "Wood"));
	kingdom.resources.set("stone", 			new Resource("stone", "Stone"));
	kingdom.resources.set("population", new Resource("population", "Population"));
}

function createTiles(kingdom: Kingdom, radius: number) {
	const hexes = getHexesInRadius(radius);

	for(const hex of hexes) {
		let typeIndex = Math.floor(Math.random() * 4);
		let type: TileType;
		switch (typeIndex) {
			case 0: type = TileType.Plains; break; 
			case 1: type = TileType.Forest; break; 
			case 2: type = TileType.Mountains; break; 
			case 3: type = TileType.Fields; break; 
		}
		kingdom.addTile(new Tile(hex.q, hex.r, randomTileDistribution(), 8));
	}	
}

function createKingdom(name: string, radius: number): Kingdom {
	const kingdom = new Kingdom(name);

	createResources(kingdom);
	createTiles(kingdom, radius);

	return kingdom;
}

const kingdom = createKingdom("My Kingdom", 3);

const body = document.querySelector("body")!;

const kingdomPanel = new KingdomPanel();
kingdomPanel.show();
body.appendChild(kingdomPanel.panel);

const tilePanel = new TileInfoPanel();
body.appendChild(tilePanel.panel);

let selectedTile: Tile | undefined = undefined;

function selectTile(tile: Tile) {
	if(selectedTile == tile) {
		selectedTile = undefined;
		tilePanel.hide();
	} else {
		selectedTile = tile;
		document.getElementById("tile-panel")?.classList.add("active");
		tilePanel.setTile(selectedTile);
		tilePanel.show();
	}
}

tilesCanvas.addEventListener("click", (e) => {
	const rect = tilesCanvas.getBoundingClientRect();
	const x = e.clientX - rect.left - tilesCanvas.width / 2;
	const y = e.clientY - rect.top - tilesCanvas.height / 2;

	const hex = pixelToHex({x,y}, tileSize);

	const tile = kingdom.getTile(hex.q, hex.r);
	if(tile) {
		selectTile(tile);	
	}
})

let last = performance.now();
function loop(now: number) {
	const dt = (now - last) / 1000;
	
	kingdom.tick(dt);

	last = now;

	renderTiles(kingdom, selectedTile);	
	requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
