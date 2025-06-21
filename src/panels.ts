import { resizeCanvas } from "./canvas";
import { drawDistributionPieChart, Tile } from "./tiles";

export enum PanelSide {
	Left,
	Right,
}

export class Panel {
	public title: string;
	public panel: HTMLElement;

	constructor(title: string, side: PanelSide) {
		this.title = title;
		this.panel = document.createElement("div");
		this.panel.classList.add("panel");
		this.panel.classList.add(side == PanelSide.Left ? "left" : "right");

		const titleElem = document.createElement("h1");
		titleElem.innerText = this.title;
		const closeButton = document.createElement("button");
		closeButton.innerText = "x";

		closeButton.addEventListener("click", () => this.hide());

		const header = document.createElement("section");
		header.classList.add("header");

		header.appendChild(titleElem);
		header.appendChild(closeButton);

		this.panel.appendChild(header);
	}

	show() { this.panel.classList.add("active") };
	hide() { this.panel.classList.remove("active") };
}

function createSection(title: string): HTMLElement {
	const section = document.createElement("section");
	const header = document.createElement("h3");
	header.innerText = title;
	section.appendChild(header);
	return section;
} 

export class KingdomPanel extends Panel {
	resourceSection = createSection("Resources");
	resourceList = document.createElement("ul");

	constructor() {
		super("Your Kingdom", PanelSide.Left )
	
		this.resourceList.innerHTML += "<li>Food: <span>0.00</span>";
		this.resourceList.innerHTML += "<li>Stone: <span>0.00</span>";
		this.resourceList.innerHTML += "<li>Wood: <span>0.00</span>";
		this.resourceList.innerHTML += "<li>Population: <span>0.00</span>";

		this.resourceSection.appendChild(this.resourceList);	
		this.panel.appendChild(this.resourceSection);
	};
}

export class TileInfoPanel extends Panel {
	private distSection = createSection("Distribution");
	private distCanvas = document.createElement("canvas");
	private distCtx = this.distCanvas.getContext('2d')!;

	private buildingSection = createSection("Buildings");
	private buildingList = document.createElement("ul");

	constructor() {
		super("Tile Info", PanelSide.Right);

		this.distSection.classList.add("tile-distribution");
		this.distSection.appendChild(this.distCanvas);

		this.distCanvas.addEventListener("resize", () => resizeCanvas(this.distCanvas));

		this.buildingSection.appendChild(this.buildingList);

		this.panel.appendChild(this.distSection);
		this.panel.appendChild(this.buildingSection);
	}

	setTile(tile: Tile) {
		resizeCanvas(this.distCanvas);
		drawDistributionPieChart(
			this.distCanvas.width/2,
			this.distCanvas.height/2,
			this.distCanvas.width/2,
			tile.typeDistribution,
			this.distCtx
		);

		this.buildingList.innerHTML = "";
		for(const b of tile.buildings) {
			const elem = document.createElement("li");
			elem.innerText = b == null ? "Empty" : b.name;
			this.buildingList.appendChild(elem);
		}
	}
}
