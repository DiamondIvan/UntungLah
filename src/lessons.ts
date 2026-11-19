import type { Question, TopicId } from './domain';

/**
 * Lesson content for the six-topic curriculum. Worked examples use the fictional
 * Mak Cik's Nasi Lemak stall, which is also the demo workspace:
 * 50 packs sold at RM4.50 (RM225), ingredients used RM90, packaging RM10, allocated gas RM10
 * (production cost RM110, RM2.20 per pack), and RM35 of other daily operating expenses
 * (transport RM15, stall rental RM20). Cash paid for ingredients that day was RM80.
 */
export type Table = { columns: string[]; rows: string[][] };
export type Block =
  | { kind: 'text'; heading?: string; text: string }
  | { kind: 'list'; heading?: string; intro?: string; items: string[] }
  | { kind: 'table'; heading?: string; intro?: string; table: Table; after?: string }
  | { kind: 'formula'; heading?: string; formula: string; note?: string }
  | { kind: 'callout'; tone: 'tip' | 'warning'; title: string; text: string }
  | { kind: 'highlight'; label: string; value: string; note: string };
export type SortCategory = 'sale' | 'purchase' | 'expense' | 'wastage';
export type SortItem = { text: string; answer: SortCategory; why: string };
export type Lesson = {
  id: TopicId; title: string; summary: string; headline: string; minutes: number; objectives: string[];
  learn: Block[]; example: { intro: string; blocks: Block[] };
  questions: Question[]; practice: { title: string; intro: string }; task: string;
};

const question = (prompt: string, options: string[], correct: number, explanation: string): Question => ({ prompt, options, correct, explanation });

export const exampleBusiness = {
  name: 'Mak Cik’s Nasi Lemak', description: 'A small food stall selling nasi lemak at a local pasar malam.', price: 4.5,
  figures: [['Packs prepared and sold', '50'], ['Total sales', 'RM225'], ['Ingredients used', 'RM90'], ['Packaging used', 'RM10'], ['Allocated gas cost', 'RM10'], ['Other daily operating expenses', 'RM35']],
};

export const sortExercise: SortItem[] = [
  { text: 'Sold 50 packs of nasi lemak', answer: 'sale', why: 'Money comes in from customers.' },
  { text: 'Bought rice and eggs for tomorrow', answer: 'purchase', why: 'Ingredients bought for the business are a purchase.' },
  { text: 'Paid RM15 for transport to the market', answer: 'expense', why: 'Transport is a cost of running the stall.' },
  { text: '3 packs left unsold at closing', answer: 'wastage', why: 'Unsold food is product lost, not money paid today.' },
  { text: 'Paid the stall rental', answer: 'expense', why: 'Rental is an operating expense.' },
  { text: 'Bought a bundle of banana leaves', answer: 'purchase', why: 'Packaging supplies are a purchase.' },
];

export const lessons: Lesson[] = [
  {
    id: 'records', title: 'Record Keeping', summary: 'Know where your money goes.', headline: 'Every ringgit counts: start recording your business money', minutes: 5,
    objectives: ['Understand why business records matter.', 'Identify sales, purchases and expenses.', 'Record daily business transactions.', 'Review basic daily business performance.'],
    learn: [
      { kind: 'text', heading: 'What is record keeping?', text: 'Record keeping means writing down the money coming into and going out of your business. Without records, you may know how much cash you have, but not how much your business actually earned.' },
      { kind: 'table', heading: 'What should you record?', table: { columns: ['Record', 'Example'], rows: [['Sales', 'Sold 50 nasi lemak for RM225'], ['Purchases', 'Bought rice and eggs for RM80'], ['Operating expenses', 'Paid RM15 for transport'], ['Stock / wastage', '3 unsold packs'], ['Payment method', 'RM150 cash, RM75 e-wallet']] } },
      { kind: 'list', heading: 'Understand the difference', items: ['Sales: money earned from customers.', 'Purchases: money spent buying ingredients or supplies.', 'Expenses: costs such as transport, stall rental and utilities.', 'Wastage: products or ingredients lost or unsold.'] },
      { kind: 'callout', tone: 'warning', title: 'Remember', text: 'Buying RM100 of ingredients does not mean you used RM100 of ingredients that day. Record purchases separately from the ingredients you actually used.' },
    ],
    example: {
      intro: 'Mak Cik records her business transactions for Monday.',
      blocks: [
        { kind: 'table', table: { columns: ['Transaction', 'Amount'], rows: [['Nasi lemak sales', '+RM225'], ['Bought ingredients', '−RM80'], ['Transport', '−RM15'], ['Stall rental', '−RM20']] }, after: 'She now has a record of her sales and spending instead of relying on memory. She used RM90 of ingredients that day, but RM10 of it came from stock she bought earlier, so she paid only RM80.' },
      ],
    },
    questions: [
      question('Which of these is a business sale?', ['Buying rice', 'Selling nasi lemak to a customer', 'Paying stall rental', 'Throwing away unsold packs'], 1, 'Selling nasi lemak brings money into the business.'),
      question('Mak Cik buys RM100 of ingredients but uses only RM60 today. How should she record it?', ['Record RM100 as ingredients used today', 'Record the RM100 purchase and note that RM60 was used', 'Record nothing until everything is used', 'Record RM60 as a sale'], 1, 'Record the RM100 purchase. RM60 was used today and RM40 is still stock for later.'),
    ],
    practice: { title: 'Record today’s transactions', intro: 'Sort each transaction into sales, purchases, expenses or wastage, then check your answers.' },
    task: 'Record every sale and expense for the next three business days.',
  },
  {
    id: 'cost', title: 'Cost Calculation', summary: 'Know how much each product really costs.', headline: 'What does it really cost to make one product?', minutes: 6,
    objectives: ['Identify direct and indirect costs.', 'Calculate total production cost.', 'Calculate cost per unit.', 'Understand why hidden costs matter.'],
    learn: [
      { kind: 'text', heading: 'What is cost calculation?', text: 'It means working out how much money you spend to produce or sell each product.' },
      { kind: 'table', heading: 'Types of costs', table: { columns: ['Cost type', 'Nasi lemak example'], rows: [['Ingredients', 'Rice, coconut milk, eggs, sambal'], ['Packaging', 'Banana leaf, paper, plastic'], ['Operating / overhead', 'Gas, rental, utilities'], ['Transport', 'Travel to buy ingredients']] } },
      { kind: 'formula', heading: 'Cost per unit', formula: 'Cost per unit = Total production cost ÷ Units produced' },
      { kind: 'callout', tone: 'tip', title: 'Hidden costs matter', text: 'Gas, banana leaves and small extras are easy to forget. Leaving them out makes each pack look cheaper to make than it really is.' },
    ],
    example: {
      intro: 'Mak Cik prepares 50 nasi lemak packs.',
      blocks: [
        { kind: 'table', table: { columns: ['Cost', 'Amount'], rows: [['Rice, eggs, sambal and other ingredients', 'RM90'], ['Packaging', 'RM10'], ['Allocated gas cost', 'RM10'], ['Total production cost', 'RM110']] } },
        { kind: 'formula', formula: 'RM110 ÷ 50 packs = RM2.20' },
        { kind: 'highlight', label: 'Cost per nasi lemak pack', value: 'RM2.20', note: 'Each pack costs about RM2.20 to produce.' },
      ],
    },
    questions: [
      question('A vendor spends RM120 to produce 40 drinks. What is the cost per drink?', ['RM0.33', 'RM3.00', 'RM4.00', 'RM30.00'], 1, 'RM120 divided by 40 drinks is RM3.00 per drink.'),
      question('Which is an example of an indirect operating cost?', ['Rice used in nasi lemak', 'Packaging for one pack', 'Stall rental', 'Eggs for the sambal'], 2, 'Stall rental is an operating overhead. It does not go into any single pack.'),
    ],
    practice: { title: 'Cost calculator', intro: 'Change the costs and the number of units produced. UntungLah calculates the cost per unit.' },
    task: 'Calculate the actual cost of producing one of your best-selling products.',
  },
  {
    id: 'pricing', title: 'Pricing Strategy', summary: 'Set a price that makes business sense.', headline: 'Are you selling too cheaply?', minutes: 6,
    objectives: ['Understand selling price and cost per unit.', 'Calculate gross profit per product.', 'Understand profit margin.', 'Make better pricing decisions when costs change.'],
    learn: [
      { kind: 'list', heading: 'What is pricing strategy?', intro: 'Pricing strategy means deciding how much to charge customers. Your price should consider:', items: ['Product cost', 'Operating expenses', 'Competitor prices', 'Customer willingness to pay', 'Your desired profit'] },
      { kind: 'formula', heading: 'Gross profit per unit', formula: 'Gross profit per unit = Selling price − Unit cost', note: 'In the Practice Lab this is called contribution per unit. It is before other operating expenses.' },
      { kind: 'formula', heading: 'Profit margin', formula: 'Margin = Gross profit per unit ÷ Selling price × 100%' },
    ],
    example: {
      intro: 'Mak Cik sells nasi lemak at RM4.50.',
      blocks: [
        { kind: 'table', table: { columns: ['Item', 'Amount'], rows: [['Selling price', 'RM4.50'], ['Cost per pack', 'RM2.20'], ['Difference', 'RM2.30']] } },
        { kind: 'formula', formula: 'RM2.30 ÷ RM4.50 × 100% = 51.1%' },
        { kind: 'highlight', label: 'Gross profit per pack', value: 'RM2.30', note: 'Gross margin of about 51.1%, before other operating expenses.' },
        { kind: 'text', heading: 'What if ingredient costs increase?', text: 'Suppose the unit cost rises from RM2.20 to RM2.70. At the same RM4.50 price, RM4.50 − RM2.70 = RM1.80. Mak Cik now earns RM0.50 less gross profit per pack. She could review her price, portion size, suppliers or efficiency.' },
      ],
    },
    questions: [
      question('A drink costs RM2 to make and sells for RM5. What is its gross profit per drink?', ['RM2', 'RM3', 'RM5', 'RM7'], 1, 'RM5 selling price minus RM2 cost leaves RM3 per drink before other operating expenses.'),
      question('If costs increase but the selling price stays the same, what happens to gross profit per unit?', ['It increases', 'It stays the same', 'It decreases', 'It becomes the selling price'], 2, 'A higher cost leaves less of the same price, so gross profit per unit falls.'),
      question('Mak Cik’s pack sells for RM4.50 and costs RM2.20. What is her gross margin?', ['23.0%', '48.9%', '51.1%', '104.5%'], 2, 'RM2.30 divided by RM4.50, times 100, is about 51.1%.'),
    ],
    practice: { title: 'Smart pricing simulator', intro: 'Change the unit cost, selling price and expected quantity. See gross profit per unit, margin and total gross profit.' },
    task: 'Review the selling price of one product and compare it with its actual cost.',
  },
  {
    id: 'profit', title: 'Profit Management', summary: 'Know whether your business is making money.', headline: 'Sales are not the same as profit', minutes: 7,
    objectives: ['Tell revenue, gross profit and operating profit apart.', 'Calculate estimated business profit.', 'Understand break-even points.', 'Identify costs you can control.'],
    learn: [
      { kind: 'formula', heading: 'Revenue', formula: 'Revenue = Selling price × Quantity sold', note: 'Revenue is the total money from selling products.' },
      { kind: 'formula', heading: 'Gross profit', formula: 'Gross profit = Revenue − Cost of goods sold', note: 'What remains after the cost of the products you sold.' },
      { kind: 'formula', heading: 'Operating profit (simplified)', formula: 'Operating profit = Gross profit − Operating expenses', note: 'This estimate may leave out taxes, loan costs, equipment wear and the owner’s own pay, depending on your records.' },
      { kind: 'formula', heading: 'Break-even', formula: 'Break-even units = Fixed costs ÷ (Selling price − Variable cost per unit)', note: 'Break-even is the point where revenue covers costs, with no profit and no loss. Round up to whole units.' },
    ],
    example: {
      intro: 'Mak Cik sells 50 nasi lemak packs.',
      blocks: [
        { kind: 'table', table: { columns: ['Item', 'Amount'], rows: [['Revenue', 'RM225'], ['Production cost', 'RM110'], ['Gross profit', 'RM115'], ['Other operating expenses', 'RM35'], ['Estimated operating profit', 'RM80']] } },
        { kind: 'highlight', label: 'Estimated operating profit', value: 'RM80', note: 'For this example business day, before excluded costs.' },
        { kind: 'formula', heading: 'Her break-even point', formula: 'RM35 ÷ (RM4.50 − RM2.20) = 15.2 → 16 packs', note: 'She needs to sell 16 packs to cover her RM35 of daily operating expenses under these assumptions.' },
      ],
    },
    questions: [
      question('A business earns RM500 in revenue and spends RM350 on costs. What is the difference?', ['RM150', 'RM350', 'RM500', 'RM850'], 0, 'RM500 − RM350 = RM150. If RM350 covers all relevant costs, this is the profit before any excluded expenses.'),
      question('What does break-even mean?', ['Sales are higher than last month', 'Total revenue equals total costs', 'All stock has been sold', 'Costs are zero'], 1, 'At break-even there is no profit and no loss.'),
    ],
    practice: { title: 'Profit detective', intro: 'Enter a day’s figures to see revenue, gross profit, estimated operating profit and your break-even point.' },
    task: 'Review your sales and expenses at the end of your next business day. Identify one cost you could reduce without affecting quality.',
  },
  {
    id: 'cash', title: 'Cash Flow', summary: 'Make sure your business has money to operate.', headline: 'Making sales is not enough: do you have cash available?', minutes: 6,
    objectives: ['Understand cash inflows and outflows.', 'Tell profit and cash flow apart.', 'Track money available for daily operations.', 'Plan for upcoming payments.'],
    learn: [
      { kind: 'list', heading: 'What is cash flow?', intro: 'Cash flow is the movement of money into and out of your business.', items: ['Cash inflow: customer payments and other money received.', 'Cash outflow: supplier payments, rent, utilities and other money paid.'] },
      { kind: 'formula', heading: 'Cash balance', formula: 'Closing cash = Opening cash + Cash inflows − Cash outflows' },
      { kind: 'text', heading: 'Why does cash flow matter?', text: 'A business can be profitable and still struggle if customers have not paid yet, or if supplier bills are due before cash comes in.' },
    ],
    example: {
      intro: 'Mak Cik starts the day with RM200.',
      blocks: [
        { kind: 'table', table: { columns: ['Item', 'Amount'], rows: [['Opening cash', 'RM200'], ['Customer payments received', '+RM225'], ['Ingredients paid for today', '−RM80'], ['Transport and stall rental paid', '−RM35'], ['Closing cash', 'RM310']] } },
        { kind: 'formula', formula: 'RM200 + RM225 − RM80 − RM35 = RM310' },
        { kind: 'callout', tone: 'warning', title: 'Cash and profit are not the same', text: 'Her cash rose by RM110, but her estimated operating profit was RM80. She used RM10 of ingredients bought earlier, RM10 of packaging from earlier stock and an RM10 share of gas she pays for later. Buying extra stock lowers cash today even if you use it next week.' },
      ],
    },
    questions: [
      question('A business starts with RM100, receives RM200 and pays RM150. What is its closing cash?', ['RM50', 'RM150', 'RM250', 'RM450'], 1, 'RM100 + RM200 − RM150 = RM150.'),
      question('Can a profitable business still have cash flow problems?', ['No, profit always means cash', 'Yes, the timing of payments and bills can create shortages', 'Only if it has no sales', 'Only if it has no records'], 1, 'If bills are due before customers pay, the business can run short of cash even when it is profitable.'),
    ],
    practice: { title: 'Cash flow planner', intro: 'Enter your starting cash, expected collections and upcoming payments. UntungLah shows your projected closing cash and warns you about a shortfall.' },
    task: 'List all payments due within the next seven days and check whether you have enough available cash.',
  },
  {
    id: 'growth', title: 'Business Growth', summary: 'Grow sustainably, not blindly.', headline: 'From surviving to growing your business', minutes: 6,
    objectives: ['Understand business reinvestment.', 'Set realistic savings goals.', 'Evaluate expansion decisions.', 'Recognise the risks of borrowing and growing too quickly.'],
    learn: [
      { kind: 'list', heading: 'What is business growth?', intro: 'Growth means improving your business sustainably, not simply selling more. For example:', items: ['Introducing a new product', 'Improving equipment', 'Increasing production capacity', 'Selling at another location', 'Improving marketing'] },
      { kind: 'text', heading: 'Reinvestment', text: 'Reinvestment means putting part of your business earnings back into the business: saving some earnings, buying better equipment, improving product quality, or expanding production when demand supports it.' },
      { kind: 'list', heading: 'Understand the risks', intro: 'Before expanding, ask:', items: ['Do customers actually want more?', 'Can you afford the new equipment?', 'Will the additional expenses be manageable?', 'Can you repay borrowed money?', 'What happens if sales are lower than expected?'] },
    ],
    example: {
      intro: 'Mak Cik wants to buy a larger rice cooker costing RM300.',
      blocks: [
        { kind: 'table', table: { columns: ['Question', 'Consideration'], rows: [['Is there enough demand?', 'Are her packs selling out?'], ['Can she afford it?', 'Does she have enough savings?'], ['Will costs increase?', 'Electricity and maintenance'], ['Is it worthwhile?', 'Will extra sales cover the extra costs?']] }, after: 'The purchase should be based on realistic demand and costs, not just excitement about expanding.' },
      ],
    },
    questions: [
      question('What is reinvestment?', ['Using some business earnings to improve or expand the business', 'Borrowing money for personal spending', 'Lowering prices permanently', 'Closing the stall for a holiday'], 0, 'Reinvestment puts part of your earnings back into the business.'),
      question('Should a business expand simply because sales increased for one day?', ['Yes, straight away', 'No, consider longer-term demand, costs, cash flow and risks', 'Only if a competitor expands', 'Only if it borrows the money'], 1, 'One good day is not enough evidence. Check demand over time and whether you can afford the risk.'),
    ],
    practice: { title: 'Growth decision check', intro: 'Test an equipment purchase. These are scenario estimates, not guaranteed outcomes.' },
    task: 'Set one realistic business improvement goal for the next 30 days.',
  },
];
export const getLesson = (id: TopicId) => lessons.find(lesson => lesson.id === id)!;
