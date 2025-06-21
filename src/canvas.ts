import { Kingdom } from "./kingdom";
import { Tile } from "./tiles";

export function resizeCanvas(canvas: HTMLCanvasElement) {
	canvas.width = canvas.clientWidth;
	canvas.height = canvas.clientHeight;
	console.log(canvas.width);
}

export const tilesCanvas = document.getElementById("tiles")! as HTMLCanvasElement;
const tilesCtx = tilesCanvas.getContext('2d')!;

const tilesBackgroundColor = "hsl(0, 0%, 15%)";
export const tileSize = 48;

window.addEventListener("resize", () => resizeCanvas(tilesCanvas));
resizeCanvas(tilesCanvas);

export function renderTiles(kingdom: Kingdom, selectedTile?: Tile) {
	tilesCtx.fillStyle = tilesBackgroundColor;

	tilesCtx.fillRect(0, 0, tilesCanvas.width, tilesCanvas.height);

	tilesCtx.save();
	tilesCtx.translate(tilesCanvas.width/2, tilesCanvas.height/2);

	for(const tile of kingdom.tiles) {
		tile.draw(tilesCtx, tileSize);
	}

	selectedTile?.draw(tilesCtx, tileSize, true);

	tilesCtx.restore();

}
