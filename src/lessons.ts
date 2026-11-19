import type { Question, TopicId } from './domain';

type Lesson = { id: TopicId; title: string; summary: string; objective: string; content: string; example: string; questions: Question[] };
const question = (prompt: string, options: string[], correct: number, explanation: string): Question => ({ prompt, options, correct, explanation });
export const lessons: Lesson[] = [
  {
    id: 'records', title: 'Record Keeping', summary: 'Build a daily habit of tracking money in and out.',
    objective: 'Sort sales, ingredient purchases and operating expenses into separate records.',
    content: 'Log each transaction on the day it happens. Record quantities and selling prices for sales, and use a short description for cash outflows. At the end of the day, match the totals to your cash and e-wallet receipts.',
    example: 'A pasar malam vendor records DuitNow sales and cash sales, then logs the stall fee as an operating expense.',
    questions: [
      question('How should you record a stall rental fee?', ['Sales', 'Ingredient purchase', 'Operating expense', 'Personal savings'], 2, 'Rent is an operating expense because it pays for running the stall.'),
      question('Which information makes a sale easier to check?', ['The weather', 'Quantity and unit price', 'The vendor’s age', 'A future sales target'], 1, 'Quantity multiplied by unit price gives the sale amount.'),
    ],
  },
  {
    id: 'cost', title: 'Cost Calculation', summary: 'Find out what it costs to make one portion.',
    objective: 'Estimate variable cost per portion from a batch of products.',
    content: 'Add the ingredients and packaging consumed in one batch and divide by the portions made. Keep fixed bills such as rent separate. Recheck your estimate when portion sizes or supplier prices change.',
    example: 'A kuih seller uses RM30 of ingredients and packaging for 50 pieces. The estimated variable cost is RM0.60 per piece.',
    questions: [
      question('What is RM30 of batch costs across 50 pieces?', ['RM0.30', 'RM0.50', 'RM0.60', 'RM1.67'], 2, 'RM30 divided by 50 pieces is RM0.60 per piece.'),
      question('Which cost usually rises with each extra portion?', ['Monthly stall rent', 'Packaging', 'Annual licence', 'A fixed monthly plan'], 1, 'Each extra portion needs additional packaging.'),
    ],
  },
  {
    id: 'pricing', title: 'Pricing Strategy', summary: 'Set a price that leaves room for your costs.',
    objective: 'Calculate contribution and margin, then test a price change using an explicit sales-volume assumption.',
    content: 'Subtract the estimated variable cost from the selling price to find what each sale contributes before fixed expenses. Divide that contribution by the selling price to get the margin. Try a price change with a few different sales volumes to see how sensitive the outcome is.',
    example: 'A nasi lemak seller charges RM5 and spends RM3 to make each pack. RM2 remains per pack before other operating expenses, giving a 40% gross margin.',
    questions: [
      question('A nasi lemak pack sells for RM5 and costs RM3 to make. What remains before other operating expenses?', ['RM1', 'RM2', 'RM3', 'RM5'], 1, 'Subtract RM3 of estimated variable cost from RM5 in sales to get RM2 per pack.'),
      question('If the pack sells for RM5 and contributes RM2, what is its gross margin?', ['20%', '40%', '60%', '67%'], 1, 'Divide RM2 by the RM5 selling price and multiply by 100 to get 40%.'),
      question('What can you conclude when a higher price looks better at the same sales volume?', ['Demand will rise', 'Sales volume is guaranteed', 'Contribution improves under that assumption', 'All expenses are covered'], 2, 'The result depends on the sales volume you assumed. A small real-world trial can help you check it.'),
    ],
  },
  {
    id: 'profit', title: 'Profit Management', summary: 'Understand what remains after covering costs.',
    objective: 'Use unit contribution to estimate how many sales cover fixed costs.',
    content: 'Divide fixed expenses for a period by contribution per unit and round up to estimate break-even units. Use matching periods and check your cost assumptions. When contribution is zero or negative, higher volume alone cannot cover fixed costs.',
    example: 'A food stall with RM20 in daily fixed expenses and RM2 contribution per pack needs 10 pack sales to cover those expenses.',
    questions: [
      question('How many packs cover RM20 of fixed costs at RM2 contribution per pack?', ['2', '10', '18', '22'], 1, 'RM20 divided by RM2 is 10 packs.'),
      question('What should you review when contribution per unit is negative?', ['Price and variable costs', 'Logo colours', 'Only the number of sales', 'The day’s date'], 0, 'Each additional sale loses money before fixed costs, so review pricing or variable costs.'),
    ],
  },
  {
    id: 'cash', title: 'Cash Flow', summary: 'Plan for when money enters and leaves the till.',
    objective: 'Predict whether upcoming payments fit the cash available.',
    content: 'List cash on hand, expected receipts and upcoming payments by date. Note when e-wallet settlements arrive. Keep ingredient purchases in this cash view when you pay for them, even if you use the stock over several days.',
    example: 'A drinks vendor has RM80 in cash, owes RM100 for supplies today and expects an RM80 settlement tomorrow. The vendor is RM20 short today.',
    questions: [
      question('When should tomorrow’s expected settlement enter a cash plan?', ['Yesterday', 'Today', 'Tomorrow', 'Whenever the order was placed'], 2, 'A cash plan tracks when the money becomes available to spend.'),
      question('What helps spot a cash shortfall early?', ['Listing payments by due date', 'Rounding sales up', 'Recording only profit', 'Counting stock as cash'], 0, 'Due dates show whether available cash can cover a bill on time.'),
    ],
  },
  {
    id: 'growth', title: 'Business Growth', summary: 'Test one change and learn from the results.',
    objective: 'Design a small business trial with a measurable outcome.',
    content: 'Choose one change, decide what to measure and give the trial a clear end date. Record sales and waste on comparable days. Review the evidence before committing money to a bigger change.',
    example: 'A nasi lemak vendor tracks unsold packs for five days before trying a smaller batch on a comparable weekday.',
    questions: [
      question('Which is a measurable goal?', ['Sell better', 'Get famous', 'Track unsold packs for five days', 'Grow as fast as possible'], 2, 'A clear measure and time period make it easy to review the result.'),
      question('Why change one thing at a time?', ['It guarantees profit', 'It helps interpret the result', 'It removes all costs', 'It ends the need for records'], 1, 'With fewer changes, it is easier to see what may have influenced the outcome.'),
    ],
  },
];
export const getLesson = (id: TopicId) => lessons.find(lesson => lesson.id === id)!;
