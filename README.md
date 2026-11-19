# 🇲🇾 UntungLah

### Learn Smarter. Run Better. Earn Better.

**UntungLah** is an AI-powered financial learning and business improvement platform designed for Malaysian microentrepreneurs, especially food-stall owners, pasar malam vendors, hawkers, and small informal food businesses.

Many small business owners record their daily sales but struggle to understand their actual costs, pricing strategies, cash flow, and business performance.

UntungLah aims to solve this problem by combining business record management, interactive financial education, business simulations, and AI-powered guidance in one accessible platform.

Built for **Reimagine Malaysia – Digital Inclusion Track**, UntungLah empowers Malaysian microentrepreneurs with practical financial knowledge and digital tools to make more informed business decisions.

**Our Learning Journey:**

Document → Learn → Quiz → Practise → Apply → Improve

---

## 🎯 The Problem We Solve

Many Malaysian microentrepreneurs manage their businesses based on experience and intuition rather than structured financial information.

They commonly face challenges such as:

- **Poor Financial Record-Keeping:** Difficulty tracking daily sales, purchases, and operating expenses.
- **Limited Financial Knowledge:** Lack of understanding of product costs, profit margins, and cash flow.
- **Pricing Difficulties:** Uncertainty about setting appropriate selling prices when ingredient costs increase.
- **Decision-Making Challenges:** Difficulty evaluating different business strategies.
- **Limited Practical Learning:** Difficulty applying financial knowledge to everyday business operations.

UntungLah bridges the gap between financial education and real-world business application.

---

## ✨ Key Features

### 1. My Business – Understand Your Business Finances

- Record daily sales, purchases, and operating expenses.
- Monitor money received and money paid.
- View recorded cash surplus through a financial dashboard.
- Understand business performance through simple financial summaries.

### 2. Learning Path – Learn Business Skills

Provides six short and practical financial learning topics:

| Topic | Learning Focus |
|---|---|
| Record Keeping | Track daily sales, purchases, and expenses. |
| Cost Calculation | Understand ingredient and production costs. |
| Pricing Strategy | Learn selling prices, markup, and profit margins. |
| Profit Management | Understand gross profit, operating profit, and break-even points. |
| Cash Flow | Manage available money and upcoming payments. |
| Business Growth | Understand savings, reinvestment, and business expansion. |

Each learning topic includes:
- Simple explanations.
- Malaysian small-business examples.
- Interactive quizzes with instant feedback.
- Practical activities and business improvement tasks.

### 3. Practice Lab – Practise Business Decisions

- Experiment with different product pricing strategies.
- Simulate ingredient and production cost changes.
- Compare baseline and adjusted business scenarios.
- Understand how selling prices, production costs, and assumed sales quantities affect estimated gross contribution.

### 4. AI Coach – Get Intelligent Business Guidance

Powered by Qwen AI through Alibaba Cloud Model Studio.

- Explain business financial information in simple language.
- Interpret calculated financial results.
- Explain pricing and cost simulation scenarios.
- Provide practical business improvement suggestions.
- Answer questions using the available business summary.

### 5. My Progress – Track Your Improvement

- Monitor learning activities.
- Track quiz progress.
- Save business improvement goals.
- Mark completed goals.
- Encourage continuous learning and business improvement.

---

## 💡 What Makes UntungLah Different?

UntungLah is more than a bookkeeping application or an online financial learning platform.

It connects three important elements:

| Element | Purpose |
|---|---|
| Financial Awareness | Help users understand their business records and financial position. |
| Practical Learning | Teach essential financial concepts through local business examples. |
| Decision Support | Allow users to experiment with business scenarios and understand possible outcomes. |

Instead of only teaching financial concepts, UntungLah connects learning activities to business information and encourages users to take practical action.

---

## 🇲🇾 Designed for Malaysian Microentrepreneurs

UntungLah focuses on the needs of everyday Malaysian small business owners.

- **Local Currency:** Uses Malaysian Ringgit (RM).
- **Local Business Examples:** Includes familiar businesses such as nasi lemak stalls and pasar malam vendors.
- **Simple Learning:** Uses straightforward explanations instead of complicated accounting terminology.
- **Practical Applications:** Provides realistic pricing, ingredient-cost, and business-management scenarios.
- **Digital Inclusion:** Makes basic financial learning and business decision-support tools more accessible.

---

## 🚀 Three-Minute Guided Demo

Explore UntungLah through a guided demonstration using a fictional Malaysian food business, Warung Nasi Lemak.

| Step | Feature | Demonstration |
|---|---|---|
| 1 | Start Guided Demo | Open the sample Warung Nasi Lemak business. |
| 2 | My Business | Show RM200 sales, RM140 cash outflows, and RM60 recorded cash surplus. |
| 3 | Learning Path | Explore the Pricing Strategy lesson and complete a quiz. |
| 4 | Practice Lab | Compare RM5 baseline pricing with a RM5.50 scenario. |
| 5 | AI Coach | Select Explain This Decision to understand the simulation results. |
| 6 | My Progress | Save a suggested business action and mark the goal as completed. |

### Example: Pricing Simulation

| Item | Baseline | New Scenario |
|---|---:|---:|
| Selling Price | RM5.00 | RM5.50 |
| Unit Cost | RM3.00 | RM3.00 |
| Assumed Quantity | 40 packs | 40 packs |
| Contribution per Pack | RM2.00 | RM2.50 |
| Estimated Gross Contribution | RM80 | RM100 |

Under the same assumed sales quantity, the new pricing scenario increases estimated gross contribution by RM20.

Users can also adjust the assumed quantity to explore different possible outcomes.

*Note: Simulation results are estimates based on user inputs and are not guaranteed business profits.*

---

## 🛠️ Technology Stack

UntungLah uses modern web technologies to provide an interactive and responsive experience.

| Technology | Purpose |
|---|---|
| React | Build the frontend user interface. |
| Vite | Frontend development server and build tool. |
| TypeScript | Type-safe application logic and financial calculations. |
| Tailwind CSS | Responsive interface styling. |
| Lucide | Interface icons. |
| Node.js | Backend JavaScript runtime. |
| Express.js | Backend API server. |
| Qwen AI | AI-powered financial explanations and business guidance. |
| Alibaba Cloud Model Studio | Provides access to Qwen AI models. |
| Browser Storage | Stores business records, quiz attempts, and improvement goals locally. |

### System Architecture

**Frontend**
- React handles the user interface and interactions.
- Vite provides the development environment.
- TypeScript manages application logic and financial calculations.
- Tailwind CSS provides responsive styling.

**Backend**
- Express.js handles API requests.
- The backend communicates with Qwen through an OpenAI-compatible API client.
- The API key is stored in the backend environment rather than exposed to frontend code.

**AI Integration**
- Qwen interprets business summaries and calculated financial comparisons.
- The AI Coach provides explanations and practical suggestions.
- A labelled demo explanation is available without live Qwen configuration.

**Financial Calculation**
- TypeScript performs financial calculations.
- The application calculates financial figures before sending relevant results to the AI Coach.
- Qwen explains the results rather than acting as the authority for financial calculations.

---

## 💻 Getting Started

Follow these steps to run UntungLah locally.

### Prerequisites

Make sure you have installed:

- Node.js 22
- npm
- Git

### 1. Clone the Repository

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
```

### 2. Navigate to the Project Folder

```bash
cd <YOUR_PROJECT_FOLDER>
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Start the Development Server

```bash
npm run dev
```

Open the local Vite URL displayed in your terminal, typically:

```text
http://localhost:5173
```

Vite proxies API requests to the Express backend on port 3001 by default.

---

## 🤖 Qwen AI API Configuration

UntungLah supports live AI coaching through Alibaba Cloud Model Studio.

### Configuration Steps

1. Copy `.env.example` to `.env`.
2. Open the `.env` file.
3. Configure the following environment variables:

| Variable | Description |
|---|---|
| `DASHSCOPE_API_KEY` | Alibaba Cloud Model Studio API key. |
| `QWEN_BASE_URL` | OpenAI-compatible HTTPS API endpoint for the selected region. |
| `QWEN_MODEL` | Qwen model ID enabled for your project and region. |
| `PORT` | Express backend port. Default: `3001`. |

4. Save the configuration.
5. Restart the development server.

### How AI Works in UntungLah

The AI integration follows this process:

1. The user interacts with the AI Coach.
2. The frontend sends the relevant question and business summary to the backend.
3. The backend sends the request to Qwen through Alibaba Cloud Model Studio.
4. Qwen generates an explanation or business suggestion.
5. The backend returns the response to the frontend.
6. The AI Coach displays the explanation to the user.

**Important:**
- Keep the API key in the backend environment.
- Never expose the API key in frontend code.
- Do not upload `.env` to GitHub.
- Financial calculations are performed by TypeScript, not generated freely by AI.

A labelled demo explanation is available even without Qwen API configuration.

For additional information, see [AI Integration Details](docs/AI_INTEGRATION.md).

---

## 🧪 Available Commands

| Command | Description |
|---|---|
| `npm run dev` | Start the frontend and backend development servers. |
| `npm test` | Run automated domain and AI Coach checks. |
| `npm run test:browser` | Run desktop and mobile journey checks with Edge and a running built application. |
| `npm run build` | Type-check the source code and build the frontend. |
| `npm start` | Serve the built frontend and API on port 3001 after building. |

---


## 🔒 Prototype Limitations

UntungLah is currently a hackathon prototype. The following limitations apply:

- Business records are stored locally in the browser on the same origin.
- Clearing browser site storage removes locally stored records.
- The prototype supports one business workspace and its primary product.
- Recorded cash surplus represents recorded money received minus recorded money paid.
- Simulation contribution considers estimated variable production costs but excludes other operating expenses.
- Sales volume is an adjustable assumption rather than a prediction of actual customer demand.
- Live AI coaching requires valid Qwen API configuration.

### Future Development

Potential improvements include:

- Malay-language learning materials.
- More convenient mobile business record entry.
- Optional secure cloud storage and cross-device synchronisation.
- Support for multiple products and business workspaces.
- More advanced financial insights and business simulations.
- More personalised learning recommendations.

---

## 👥 Team Contributions

UntungLah is developed as a collaborative hackathon project.

The repository includes project guidance, architecture documentation, and testing checklists to support team collaboration and development using Qoder.

For more information:

- [Repository Guidelines](AGENTS.md)
- [Demo Script and Contribution Log](docs/DEMO_SCRIPT.md)
- [Architecture Documentation](docs/ARCHITECTURE.md)
- [Feature Documentation](docs/FEATURES.md)
- [Testing Documentation](docs/TESTING.md)

Team contributions and development credits should reflect actual individual contributions.

---

## 🌱 Our Vision

We believe every small business owner deserves access to the knowledge and tools needed to make better business decisions.

UntungLah aims to make financial learning more practical, financial understanding more accessible, and digital opportunities more inclusive.

**UntungLah – Learn Smarter. Run Better. Earn Better.**

*Empowering Malaysian microentrepreneurs, one better business decision at a time.*
