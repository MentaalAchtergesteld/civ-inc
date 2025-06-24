import { buildings } from "./building";
import { claimTile, createKingdom, Kingdom, tickKingdom } from "./kingdom";
import { discoverTile, drawBorder, drawSelectedTile, drawTiles, findTile, generateMap, hexDistance, pixelToHex, Resource, Tile, TileState } from "./map";
import { initializeMarket } from "./market";
import { KingdomPanel, populateBuildingBar, selectedBuilding, TilePanel } from "./panel";

// function lerp(a: number, b: number, t: number): number {
// 	return a + (b - a) * t; 
// }
//
initializeMarket()
export const kingdom = createKingdom("Your Kingdom");
// kingdom.resources[Resource.Food] += 10;
//
// populateBuildingBar(buildings);
//
// const kingdomPanel = new KingdomPanel(kingdom);
// kingdomPanel.close();
// document.getElementById("open-kingdom-panel")?.addEventListener("click", _ => kingdomPanel.open());
// const tilePanel = new TilePanel();
//
// const canvas = document.getElementById("tiles")! as HTMLCanvasElement;
// canvas.style.width = "100%";
// canvas.style.height = "100%";
// canvas.style.position = "absolute";
//
// const ctx = canvas.getContext('2d')!;
//
// function resizeCanvas(canvas: HTMLCanvasElement) {
// 		canvas.width = canvas.clientWidth;
// 		canvas.height = canvas.clientHeight;
// }
//
// window.addEventListener("resize", () => resizeCanvas(canvas));
// resizeCanvas(canvas);
//
// const map = generateMap(100, 0.05);
//
// const visibleRadius = 50;
// const discoveredRadius = 50;
// const claimedRadius = 3;
//
// for (let q = -visibleRadius; q <= visibleRadius; q++) {
// 	for (let r = -visibleRadius; r <= visibleRadius; r++) {
// 		let distance = hexDistance(q, r);
// 		if (distance > visibleRadius) continue;
//
// 		let tile = findTile(q, r, map); 
// 		if (tile == undefined) continue;
//
// 		if (distance < claimedRadius) {
// 			claimTile(kingdom, tile);
// 		} else if (distance < discoveredRadius) {
// 			tile.state = TileState.Discovered;
// 		} else {
// 			tile.state = TileState.Visible;
// 		}
// 	}
// }
//
// const keys: Record<string, boolean> = {};
//
// document.addEventListener("keydown", e => keys[e.key.toLowerCase()] = true);
// document.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);
//
// // Movement
//
// let xOffset = canvas.width/2;
// let yOffset = canvas.height/2;
//
// let currentPan = {x: 0,y: 0};
// const panSpeed = 10;
//
// function moveControls(delta: number) {
// 	let xMovement = 0;
// 	if (keys["a"]) xMovement += 1;
// 	if (keys["d"]) xMovement -= 1;
//
// 	let yMovement = 0;
// 	if (keys["w"]) yMovement += 1;
// 	if (keys["s"]) yMovement -= 1;
//
// 	let totalMovement = Math.sqrt(xMovement*xMovement + yMovement*yMovement);
//
// 	if (totalMovement > 0) {
// 		xMovement = xMovement / totalMovement;
// 		yMovement = yMovement / totalMovement;
// 	}
//
// 	currentPan.x = lerp(currentPan.x, panSpeed * xMovement, 10 * delta);
// 	currentPan.y = lerp(currentPan.y, panSpeed * yMovement, 10 * delta);
//
// 	yOffset += currentPan.y;
// 	xOffset += currentPan.x;
// }
//
// // Zooming
//
// let scale = 1;
// let minScale = 0.05;
// let maxScale = 3;
//
// canvas.addEventListener("wheel", (e) => {
// 	const delta = -e.deltaY * 0.001;
// 	const newScale = Math.min(maxScale, Math.max(minScale, scale + delta));
//
// 	const rect = canvas.getBoundingClientRect();
// 	const mx = e.clientX - rect.left;
// 	const my = e.clientY - rect.top;
//
// 	const worldX = (mx - xOffset) / scale;
// 	const worldY = (my - yOffset) / scale;
//
// 	scale = newScale;
//
// 	xOffset = mx - worldX * scale;
// 	yOffset = my - worldY * scale;
//
// 	console.log(scale);
// })
//
// // Clicking
//
// let selectedTile: Tile | undefined;
//
// let tileSize = 48;
//
// function placeBuilding(tile: Tile | undefined) {
// 	if(tile == undefined) return;
// 	if(tile.state != TileState.Claimed) return;
// 	if(tile.owner != kingdom) return;
// 	if(tile.building) return;
// 	if(!selectedBuilding!.allowedBiomes.includes(tile.biome)) return;
//
// 	tile.building = selectedBuilding;
// }
//
// function selectTile(tile: Tile | undefined) {
// 	if(selectedTile == tile) {
// 		selectedTile = undefined;
// 		tilePanel.close();
// 	} else {
// 		selectedTile = tile;
// 		tilePanel.setTile(selectedTile!);
// 		tilePanel.open();
// 	}
// }
//
// canvas.addEventListener("click", (e) => {
// 	const rect = canvas.getBoundingClientRect();
// 	const mouseX = (e.clientX - rect.left - xOffset) / scale;
// 	const mouseY = (e.clientY - rect.top - yOffset) / scale;
//
// 	const { q, r } = pixelToHex(mouseX, mouseY, tileSize);
//
// 	const tile = findTile(q, r, map);
//
// 	if(tile?.state == TileState.Undiscovered) return;
// 	if(tile?.state == TileState.Visible) discoverTile(q, r, map);
//
// 	if (selectedBuilding) {
// 		placeBuilding(tile);
// 	} else {
// 		selectTile(tile);
// 	}
//
// 	
// });
//
// let lastTime = performance.now();
// function loop(now: number) {
// 	let delta = (now - lastTime) / 1000; 
// 	lastTime = now;
//
// 	moveControls(delta);
// 	
// 	ctx.fillStyle = "hsl(0, 0%, 15%)"; 
// 	ctx.fillRect(0, 0, canvas.width, canvas.height);
//
// 	ctx.save();
// 	ctx.translate(xOffset, yOffset);
// 	ctx.scale(scale, scale);
//
// 	drawTiles(map, tileSize, ctx);
//
// 	ctx.strokeStyle = "red";
// 	ctx.lineWidth = 4;
// 	drawBorder(kingdom.tiles, tileSize, ctx);
//
// 	if (selectedTile) drawSelectedTile(selectedTile, tileSize, ctx);
//
// 	ctx.restore();
//
// 	tickKingdom(kingdom, delta);
//
// 	if(kingdomPanel.isOpen) kingdomPanel.update();
//
// 	requestAnimationFrame(loop);
// }
//
// requestAnimationFrame(loop);
