import { Resource } from "./map"

enum OrderType { Sell, Buy };

type Order = {
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

type OrderBook = {
	sells: Order[],
	buys: Order[],

	highestSell: number,
	highestBuy: number,

	lowestSell: number,
	lowestBuy: number,

	averageSell: number,
	averageBuy: number,
};

function createOrderBook(): OrderBook {
	return {
		sells: [],
		buys: [],
		highestSell: 0,
		highestBuy: 0,
		lowestSell: 0,
		lowestBuy: 0,
		averageSell: 0,
		averageBuy: 0
	} as OrderBook
}

type Market = {
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

	return true;
}

function calculateAveragePrice(orders: Order[]): number {
	const totalQuantity = orders.reduce((acc, o) => acc+=o.quantity, 0);
	const totalValue    = orders.reduce((acc, o) => acc+=o.limitPricePer*o.quantity, 0);

	return totalQuantity > 0 ? totalValue / totalQuantity : 0;
}

function updateBookData(book: OrderBook) {
	book.highestSell = book.sells[book.sells.length-1].limitPricePer;
	book.highestBuy  = book.buys[0].limitPricePer;

	book.lowestSell = book.sells[0].limitPricePer;
	book.lowestBuy  = book.buys[book.buys.length-1].limitPricePer;

	book.averageSell = calculateAveragePrice(book.sells);
	book.averageBuy  = calculateAveragePrice(book.buys);
}

function handleTrade(buy: Order, sell: Order, market: Market): boolean {
	const isBuyerInitiator = buy.timestamp > sell.timestamp;

	const price = isBuyerInitiator ? sell.limitPricePer : buy.limitPricePer;
	const traded = Math.min(buy.quantity, sell.quantity);


	const reservedFunds = market.reservedFunds.get(buy.source) ?? 0;
	if (reservedFunds < price*traded) return false;
	market.reservedFunds.set(buy.source, reservedFunds-price*traded);

	buy.spent += traded * price;

	console.log(`Trade: ${traded} ${buy.resource} @ ${price} from ${sell.source} to ${buy.source}`);

	buy.quantity -= traded;
	sell.quantity -= traded;

	buy.source.inventory[buy.resource]   += traded;
	sell.source.inventory[sell.resource] -= traded;

	return true;
}

function cleanOrder(order: Order, market: Market): boolean {
	if(order.quantity == 0 || market.currentTime > order.timestamp+order.lifetime) {
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
		matchOrders(book, market);
		updateBookData(book);
	}
	market.currentTime += dt;
}

// TEMP MARKET TESTING

type ProductionPlan = {
	inputResources: Partial<Record<Resource, number>>,
	inputPrices: Partial<Record<Resource, number>>,
	output: {
		resource: Resource,
		count: number,
	},
};

type AgentBehaviour = (company: Company, market: Market, dt: number) => void;

type Company = {
	name: string,
	money: number,
	inventory: Record<Resource, number>,
	productionPlans: ProductionPlan[],
	preferredSurplusPercentage: number,
	activeOrders: Order[],
	buyBehaviour: AgentBehaviour,
	sellBehaviour: AgentBehaviour,
}

function getRequiredResources(company: Company, dt: number): Partial<Record<Resource, number>> {
	const requiredResources: Partial<Record<Resource, number>> = {};

	for (const plan of company.productionPlans) {
		for(const [key, count] of Object.entries(plan.inputResources)) {
			const res = key as Resource;
			if (!requiredResources[res]) requiredResources[res] = 0;

			const inventoryCount = company.inventory[res];
			const preferredSurplus = count*dt*(1+company.preferredSurplusPercentage);
			if (inventoryCount >= preferredSurplus) continue;

			requiredResources[res]! += count*dt;
		}
	}

	return requiredResources;
}

function buyCautiousFollower(company: Company, market: Market, dt: number) {
	const requiredResources = getRequiredResources(company, dt);

	for (const [key, count] of Object.entries(requiredResources)) {
		const res = key as Resource;

		if (company.activeOrders.find(o => o.resource == res && o.type == OrderType.Buy)) continue;

		const book = market.books[res];
		if (book == undefined) continue;

		const basePrice = book.averageSell || 1; 
		const bidPrice = basePrice * 1.1;

		if (company.money < bidPrice * count) continue;

		const order = createBuyOrder(company, res, count, bidPrice, 50);
		pushOrder(order, market);

		for (const plan of company.productionPlans) {
			if (plan.inputResources[res]) {
				plan.inputPrices = plan.inputPrices || {};
				plan.inputPrices[res] = bidPrice;
			}
		}
	}
}

function sellCautiousFollower(company: Company, market: Market, dt: number) {
	for (const plan of company.productionPlans) {
		const { resource, count } = plan.output;

		const inventory = company.inventory[resource] ?? 0;
		const preferredSurplus = count *dt*(1+company.preferredSurplusPercentage);

		if (inventory <= preferredSurplus) continue;
		if (company.activeOrders.find(o => o.resource == resource && o.type == OrderType.Sell)) continue;

		const surplus = inventory - preferredSurplus;
		const book = market.books[resource];
		if (!book) continue;

		const outputPrice = Object.entries(plan.inputPrices).reduce((acc, [res, price]) => {
			const count = plan.inputResources[res as Resource] ?? 0;
			return acc + price * count;
		}, 0);
		const basePrice = Math.max(book.averageBuy, outputPrice);
		const sellPrice = basePrice * 1.1;

		const order = createSellOrder(company, resource, surplus, sellPrice, 50);
		pushOrder(order, market);
	}
}

function tickCompany(company: Company, market: Market, dt: number): void {
	company.buyBehaviour(company, market, dt);
	company.sellBehaviour(company, market, dt);

	company.activeOrders = company.activeOrders.filter(o => o.active);
}
