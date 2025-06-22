import { kingdom } from ".";
import { Building, createFarm } from "./building";
import { claimTile, Kingdom } from "./kingdom";
import { Biome, Tile, TileState } from "./map";

enum PanelSide {
	Right,
	Left
}

function createSection(title: string): HTMLElement {
	const section = document.createElement("section");
	const header = document.createElement("h3");
	header.innerText = title;
	section.appendChild(header);
	return section;
}

export abstract class Panel {
	public isOpen: boolean = false;
	protected element: HTMLElement = document.createElement("div");

	constructor(title: string, side: PanelSide, closeable: boolean = true) {
		this.element.classList.add("panel");

		switch (side) {
			case PanelSide.Right: this.element.classList.add("right"); break;
			case PanelSide.Left: this.element.classList.add("left"); break;
		}

		const header = document.createElement("div");
		header.classList.add("header");

		const titleElem = document.createElement("h1");
		titleElem.innerText = title;
		header.appendChild(titleElem);

		if(closeable) {
			const closeButton = document.createElement("button");
			closeButton.innerText = "X";
			closeButton.classList.add("square");

			closeButton.addEventListener("click", () => this.close());
			header.appendChild(closeButton);
		}

		this.element.appendChild(header);
		document.querySelector("body")!.appendChild(this.element);
	}

	close() { this.element.classList.remove("active"); this.isOpen = false; };
	open()  { this.element.classList.add("active");    this.isOpen = true;  };
}

export class KingdomPanel extends Panel {
	private resourceSection = createSection("Resources");
	private resourceList = document.createElement("ul");

	constructor(private kingdom: Kingdom) {
		super("Kingdom", PanelSide.Left);

		this.resourceSection.appendChild(this.resourceList);
		this.element.appendChild(this.resourceSection);

		this.update();
	}

	updateResourceSection() {
		this.resourceList.innerHTML = "";

		for(const [res, count] of Object.entries(this.kingdom.resources)) {
			const li = document.createElement("li");
			li.innerText = `${res}: ${count.toFixed(2)}`;
			this.resourceList.appendChild(li);
		}
	}

	update() {
		this.updateResourceSection();
	}
}

export class TilePanel extends Panel {
	private infoSection: HTMLElement = createSection("Info");	
	private tileState: HTMLParagraphElement = document.createElement("p");
	private biomeType: HTMLParagraphElement = document.createElement("p");

	private yieldsSection: HTMLElement = createSection("Yields");
	private yieldsList: HTMLUListElement = document.createElement("ul");
	
	private buildingSection: HTMLElement = createSection("Building");
	private buildingInfo: HTMLElement = document.createElement("div");

	private claimSection: HTMLElement = createSection("Claim");

	private tile: Tile | undefined;

	constructor() {
		super("Tile", PanelSide.Right)

		this.infoSection.appendChild(this.tileState);
		this.infoSection.appendChild(this.biomeType);
		this.element.appendChild(this.infoSection);

		this.yieldsSection.appendChild(this.yieldsList);
		this.element.appendChild(this.yieldsSection);

		this.buildingSection.appendChild(this.buildingInfo);
		this.element.appendChild(this.buildingSection);

		const claimBtn = document.createElement("button");
		claimBtn .innerText = "Claim";
		claimBtn.addEventListener("click", (_) => {
			if(this.tile == undefined) return;
			claimTile(kingdom, this.tile);
		});

		this.claimSection.appendChild(claimBtn);

		this.element.appendChild(this.claimSection);
	}

	updateTileState() {
		this.tileState.innerText = "State: ";
		if (this.tile == undefined) return;

		switch (this.tile.state) {
			case TileState.Undiscovered: this.tileState.innerText += " Undiscovered"; break;
			case TileState.Visible:      this.tileState.innerText += " Visible";      break;
			case TileState.Discovered:   this.tileState.innerText += " Discovered";   break;
			case TileState.Claimed:			 this.tileState.innerText += " Claimed";			 break;
		}
	}

	updateBiome() {
		this.biomeType.innerText = "Biome:";
		if (this.tile == undefined) return;

		switch (this.tile.biome) {
			case Biome.Plains:    this.biomeType.innerText += " Plains";    break;
			case Biome.Hills:     this.biomeType.innerText += " Hills";     break;
			case Biome.River:     this.biomeType.innerText += " River";     break;
			case Biome.Desert:    this.biomeType.innerText += " Desert";    break;
			case Biome.Mountains: this.biomeType.innerText += " Mountains"; break;
			case Biome.Forest:    this.biomeType.innerText += " Forest";    break;
		}
	}

	updateYieldsList() {
		this.yieldsList.innerHTML = "";
		if(this.tile == undefined) return;

		for(const [resource, multiplier] of Object.entries(this.tile.yieldMultipliers)) {
			const li = document.createElement("li");
			li.innerText = `${resource}: ${multiplier}x`;
			this.yieldsList.appendChild(li);
		}
	}

	updateBuildingInfo() {
		this.buildingInfo.innerHTML = "";
		if (this.tile == undefined) return;

		if (this.tile.building == undefined) {
			this.buildingSection.classList.add("hidden");
			return;
		} else {
			this.buildingSection.classList.remove("hidden");
		}

		const b = this.tile.building;
		this.buildingInfo.innerHTML += `<p><strong>Type: </strong>${b.name}</p>`;

		this.buildingInfo.innerHTML += `<p><strong>Productivity: </strong>${b.productivity.toFixed(2)}</p>`

		this.buildingInfo.innerHTML += "<strong>Production:</strong>";
		const list = document.createElement("ul");
		for(const [res, count] of Object.entries(b.output)) {
			const li = document.createElement("li");
			li.innerText = `${res}: ${count}`;
			list.appendChild(li);
		}
		this.buildingInfo.appendChild(list);
	}

	setTile(tile: Tile) {
		this.tile = tile;
		this.updateTileState();
		this.updateBiome();
		this.updateYieldsList();
		this.updateBuildingInfo();

		if (this.tile.state == TileState.Claimed) {
			this.claimSection.classList.add("hidden");
		} else {
			this.claimSection.classList.remove("hidden");
		}
	}
}

const buildingBar = document.getElementById("building-bar")!;
export let selectedBuilding: Building | undefined;

export function populateBuildingBar(buildings: Building[]) {
	buildingBar.innerHTML = "";

	for(const b of buildings) {
		const btn = document.createElement("button");
		btn.classList.add("square");
		btn.innerText = b.name;

		btn.addEventListener("click", () => {
			if(selectedBuilding == b) {
				selectedBuilding = undefined;
				btn.classList.remove("selected");
			} else {
				Array.from(buildingBar.querySelectorAll("button.selected"))
					.forEach(btn => btn.classList.remove("selected"));

					selectedBuilding = b;
					btn.classList.add("selected");
			}
		});

		buildingBar.appendChild(btn);
	}
}
