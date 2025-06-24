// import { Resource } from "./map"
enum Resource {
	Wheat = 'Wheat',
	Bread = 'Bread',
	Air = 'Air'
}

type ResourceMap = Partial<Record<Resource, number>>;

enum OrderType { Sell = 'Sell', Buy = 'Buy' };

interface Order {
	type: OrderType,
	timestamp: number,
	lifetime: number,
	resource: Resource,
	quantity: number,
	limitPricePer: number
	source: Company,
	active: boolean,
	spent: number,
	totalReserved: number,
}

export function createSellOrder(
	source: Company,
	resource: Resource,
	quantity: number,
	limitPricePer: number,
	lifetime: number,
): Order {
	return {
		type: OrderType.Sell,
		resource,
		quantity,
		limitPricePer,
		source,
		lifetime,
		timestamp: 0,
		active: true,
		spent: 0,
		totalReserved: limitPricePer*quantity,
	}
}

export function createBuyOrder(
	source: Company,
	resource: Resource,
	quantity: number,
	limitPricePer: number,
	lifetime: number,
): Order {
	return {
		type: OrderType.Buy,
		resource,
		quantity,
		limitPricePer,
		source,
		lifetime,
		timestamp: 0,
		active: true,
		spent: 0,
		totalReserved: 0,
	}
}

interface OrderBook {
	sells: Order[],
	buys: Order[],

	highestSell: number,
	lowestSell: number,
	averageSell: number,

	highestBuy: number,
	lowestBuy: number,
	averageBuy: number,

	sellHistory: number[],
	buyHistory: number[],
};

function createOrderBook(): OrderBook {
	return {
		sells: [], buys: [],
		highestSell: 0,
		highestBuy: 0,
		lowestSell: 0,
		lowestBuy: 0,
		averageSell: 0,
		averageBuy: 0,
		sellHistory: [], buyHistory: []
	} as OrderBook
}

interface Market {
	books: Record<Resource, OrderBook>,
	reservedFunds: Map<Company, number>;
	currentTime: number,
}

export function createMarket(): Market {
	const keys = Object.values(Resource) as Resource[];
	const books = Object.fromEntries(keys.map(r => [r, createOrderBook()])) as Record<Resource, OrderBook>;

	return {
		books,
		currentTime: 0,
		reservedFunds: new Map(), 
	}
}

function reserveFunds(company: Company, amount: number, market: Market) {
	const current = market.reservedFunds.get(company) ?? 0;
	company.money -= amount;
	market.reservedFunds.set(company, current + amount);
}

function releaseFunds(company: Company, amount: number, market: Market) {
	const current = market.reservedFunds.get(company) ?? 0;
	const releaseable = Math.min(current, amount);
	market.reservedFunds.set(company, current-releaseable);
	company.money += releaseable;
}

export function pushOrder(order: Order, market: Market): boolean {
	const orderPrice = order.limitPricePer * order.quantity;
	if (order.source.money <  orderPrice) return false;

	reserveFunds(order.source, orderPrice, market);

	order.timestamp = market.currentTime;
	let book = market.books[order.resource];
	switch(order.type) {
		case OrderType.Sell: book.sells.push(order); break;
		case OrderType.Buy:  book.buys.push(order);  break;
	}

	order.source.activeOrders.push(order);

	log(`New ${order.type} order from ${order.source.name}: ${order.quantity} ${order.resource} for ${order.limitPricePer} @ ${market.currentTime}`);

	return true;
}

function calculateAveragePrice(orders: Order[]): number {
	const totalQuantity = orders.reduce((acc, o) => acc+o.quantity, 0);
	const totalValue    = orders.reduce((acc, o) => acc+o.limitPricePer*o.quantity, 0);

	return totalQuantity > 0 ? totalValue / totalQuantity : 0;
}

const MAX_HISTORY = 100;
function updateBookData(book: OrderBook) {
	if(book.sells.length > 0) {
		book.highestSell = book.sells[book.sells.length-1].limitPricePer;
		book.lowestSell = book.sells[0].limitPricePer;
	}

	if(book.buys.length > 0) {
		book.highestBuy  = book.buys[0].limitPricePer;
		book.lowestBuy  = book.buys[book.buys.length-1].limitPricePer;
	}


	book.averageSell = calculateAveragePrice(book.sells);
	book.averageBuy  = calculateAveragePrice(book.buys);

	book.sellHistory.push(book.averageSell);
	book.buyHistory.push(book.averageBuy);

	if (book.sellHistory.length > MAX_HISTORY) book.sellHistory.shift();
	if (book.buyHistory.length > MAX_HISTORY)  book.buyHistory.shift();
}

function getRecentAverage(type: OrderType, period: number, book: OrderBook): number {
	const history = type == OrderType.Sell ? book.sellHistory : book.buyHistory;
	const len = history.length;
	if (len == 0) return 0;
	const start = Math.max(0, len - period);
	const slice = history.slice(start, len);
	const sum = slice.reduce((acc, v) => acc + v, 0);

	return sum / slice.length;
}

function handleTrade(buy: Order, sell: Order, market: Market): boolean {
	const isBuyerInitiator = buy.timestamp > sell.timestamp;

	const price = isBuyerInitiator ? sell.limitPricePer : buy.limitPricePer;
	const traded = Math.min(buy.quantity, sell.quantity);


	const reservedFunds = market.reservedFunds.get(buy.source) ?? 0;
	if (reservedFunds < price*traded) return false;
	market.reservedFunds.set(buy.source, reservedFunds-price*traded);

	buy.spent += traded * price;

	log(`Trade: ${traded} ${buy.resource} for ${price} from ${sell.source.name} to ${buy.source.name} @ ${market.currentTime}`);

	buy.quantity -= traded;
	sell.quantity -= traded;

	buy.source.inventory[buy.resource]   = (buy.source.inventory[buy.resource] || 0)   + traded;
	sell.source.inventory[sell.resource] = (sell.source.inventory[sell.resource] || 0) + traded;

	return true;
}

function cleanOrder(order: Order, market: Market): boolean {
	if(order.quantity == 0 || market.currentTime > order.timestamp+order.lifetime) {
	// if(order.quantity == 0) {
		order.active = false;
		releaseFunds(order.source, order.totalReserved-order.spent, market);
		return false;
	} else {
		return true;
	}
}

function matchOrders(book: OrderBook, market: Market): void {
	book.buys.sort((a, b) => 
	  b.limitPricePer - a.limitPricePer ||
		a.timestamp - b.timestamp
	);

	book.sells.sort((a, b) =>
	  a.limitPricePer - b.limitPricePer ||
		a.timestamp - b.timestamp
	);

	let i = 0;
	let j = 0;

	while(i < book.buys.length && j < book.sells.length) {
		const buy =  book.buys[i];
		const sell = book.sells[j];

		if (buy.limitPricePer < sell.limitPricePer) break;
	
		const success = handleTrade(buy, sell, market);
		
		if (!success) continue;

		if (buy.quantity == 0)  i++;
		if (sell.quantity == 0) j++;
	}

	book.buys  = book.buys.filter(o => cleanOrder(o, market));
	book.sells = book.sells.filter(o => cleanOrder(o, market));
}

export function tickMarket(market: Market, dt: number): void {
	for(const book of Object.values(market.books)) {
		updateBookData(book);
		matchOrders(book, market);
	}
	market.currentTime += dt;
}

// TEMP MARKET TESTING

interface ProductionPlan {
	input: ResourceMap,
	output: { resource: Resource, count: number },
}

interface Company {
	name: String,
	money: number,
	inventory: ResourceMap,
	preferredMargin: number,
	preferredSurplus: number,
	priceSensitivity: number,
	production: ProductionPlan[]
	activeOrders: Order[]
}

function getRequiredResources(company: Company): ResourceMap {
	return company.production.reduce((required, plan) => {
		Object.entries(plan.input).forEach(([resKey, need]) => {
			const res = resKey as Resource;
			required[res] = (required[res] || 0) + need;
		});
		return required;
	}, {} as ResourceMap);
}

function produce(company: Company, dt: number) {
	for (const plan of company.production) {
		const usedResources = {} as ResourceMap;
		let success = true;
		for (const [resKey, need] of Object.entries(plan.input)) {
			const res = resKey as Resource;

			const dNeed = need*dt;

			const have = company.inventory[res] || 0;
			// if(company.name.startsWith("Bakery")) console.log("have " + have);
			if(have < dNeed) { success = false; break; }
			
			company.inventory[res]! -= dNeed;
			usedResources[res] = dNeed;
		}
	
		if (success) {
			const output = plan.output.resource;
			const count = plan.output.count;
			// if(company.name.startsWith("Bakery")) console.log("output" + output);
			company.inventory[output] = (company.inventory[output] || 0) + count*dt;
		} else {
			for (const [resKey, used] of Object.entries(usedResources)) {
				const res = resKey as Resource;
				company.inventory[res]! += used;
			}	
		}
	}
}

function buyBehaviour(
	company: Company,
	market: Market,
	dt: number,
) {
	const required = getRequiredResources(company);

	for (const [resKey, need] of Object.entries(required)) {
		const res = resKey as Resource;

		if(company.activeOrders.find(o => o.resource == res && o.type == OrderType.Buy)) continue;

		const dNeed = need*dt;

		const book = market.books[res];
		if (!book) continue;

		const basePrice = getRecentAverage(OrderType.Sell, 50, book) || 1;
		const bidPrice = basePrice * (1 + company.priceSensitivity);

		const totalCost = bidPrice * dNeed;
		if(company.money < totalCost) continue;

		const order = createBuyOrder(company, res, dNeed, bidPrice, 5);

		pushOrder(order, market);
	}
}

function getPlanCost(plan: ProductionPlan, market: Market): number {
	return Object.entries(plan.input).reduce((total, [resKey, amount]) => {
		const res = resKey as Resource;

		// const avgPrice = market.books[res]?.averageSell || 1;
		if (market.books[res] == undefined) return total;
		const avgPrice = getRecentAverage(OrderType.Sell, 10, market.books[res]) || 1;
		return total + amount * avgPrice;
	}, 0);
}

function sellBehaviour(
	company: Company,
	market: Market,
	dt: number
) {
	for (const plan of company.production) {
		const res = plan.output.resource;
		const produced = plan.output.count*dt;

		if (company.activeOrders.find(o => o.resource == res && o.type == OrderType.Sell)) continue;

		const have = company.inventory[res] || 0;

		const preferredSurplus = produced * (1 + company.preferredSurplus);

		if(have-preferredSurplus <= 0) continue;

		const book = market.books[res];
		if (!book) continue;
		
		const marketPrice = (getRecentAverage(OrderType.Buy, 10, book) || 1) * (1 + company.priceSensitivity);
		const minPrice = getPlanCost(plan, market) * (1 + company.preferredMargin);


		const askPrice = Math.max(marketPrice, minPrice, 1);


		const order = createSellOrder(company, res, have, askPrice, 5);
		pushOrder(order, market);
	}
}

function cleanActiveContracts(company: Company): void {
	company.activeOrders = company.activeOrders.filter(o => o.active);
}

function tickCompany(company: Company, market: Market, dt: number): void {
	produce(company, dt);
	buyBehaviour(company, market, dt);
	sellBehaviour(company, market, dt);
	cleanActiveContracts(company);
}

function createFarm(): Company {
	return {
		name: "Farm" + Math.floor(Math.random()*100),
		money: 100,
		inventory: { [Resource.Air]: 5 },
		preferredMargin: Math.random()*0.2,
		preferredSurplus: Math.random()*3,
		priceSensitivity: Math.random()*0.2,
		production: [
			{
				input: { [Resource.Air]: 1 },
				output: { resource: Resource.Wheat, count: 1 },
			}
		],
		activeOrders: [],
	}
}

function createBakery(): Company {
	return {
		name: "Bakery" + Math.floor(Math.random()*100),
		money: 100,
		inventory: {},
		preferredMargin: Math.random()*0.2,
		preferredSurplus: Math.random()*3,
		priceSensitivity: Math.random()*0.2,
		production: [
			{
				input: { [Resource.Wheat]: 1 },
				output: { resource: Resource.Bread, count: 1 }, 
			}
		],
		activeOrders: []
	}
}

function createConsumer(): Company {
	return {
		name: "Consumer" + Math.floor(Math.random()*1000),
		money: 10000,
		inventory: {},
		preferredMargin: 0,
		preferredSurplus: 0,
		priceSensitivity: 0.5,
		production: [
			{
				input: { [Resource.Bread]: 1 },
				output: { resource: Resource.Air, count: 1 },
			}
		],
		activeOrders: []
	}
}

export function initializeMarket() {
	const farmCount = 3;
	const bakeryCount = 5;
	const consumerCount = 5;

	const farms = Array.from({length:farmCount}, () => createFarm());
	const bakeries = Array.from({length:bakeryCount}, () => createBakery());
	const consumers = Array.from({length:consumerCount}, () => createConsumer());
	let companies = [...farms, ...bakeries, ...consumers];

	const market = createMarket();

	let lastTime = performance.now();
	const loop = (now: number) => {
		const dt = (now - lastTime)/1000;
		lastTime = now;

		tickMarket(market, dt);
		companies.forEach(c => tickCompany(c, market, dt));

		companies = companies.filter(c => c.money > 0);

		const wheat = document.getElementById("wheat")!;
		const bread = document.getElementById("bread")!;

		let farms = companies.filter(c => c.name.startsWith("Farm"));
		wheat.innerText = "";
		wheat.innerText += "[WHEAT]";
		wheat.innerText += " Avg Price: " + getRecentAverage(OrderType.Buy, 10, market.books[Resource.Wheat]!).toFixed(2);
		wheat.innerText += " Farms left:" + farms.length; 
		wheat.innerText += " Avg Money: " + (farms.reduce((acc, b) => acc+b.money, 0) / farms.length).toFixed(2); 

		let bakeries = companies.filter(c => c.name.startsWith("Bakery"));
		bread.innerText = "";
		bread.innerText += "[BREAD]";
		bread.innerText += " Avg Price: " + getRecentAverage(OrderType.Buy, 10, market.books[Resource.Bread]!).toFixed(2);
		bread.innerText += " Bakeries left:" + bakeries.length; 
		bread.innerText += " Avg Money: " + (bakeries.reduce((acc, b) => acc+b.money, 0) / bakeries.length).toFixed(2); 

		// consumers.forEach(c => c.money = 10000);
		// console.log(bakeries.reduce((acc, b) => acc+b.money, 0)/bakeries.length);
	
		requestAnimationFrame(loop);
	}
	requestAnimationFrame(loop);
}

const DO_LOG = false;

function log(message: string): void {
	if (!DO_LOG) return;
	const logElem = document.getElementById("log")!;
	logElem.innerText += message + "\n";
	logElem.scrollTop = logElem.scrollHeight;
}
