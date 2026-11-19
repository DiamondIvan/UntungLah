# UntungLah development guide

UntungLah teaches financial decision-making to Malaysian microentrepreneurs. Protect the core flow from records through a lesson, quiz, simulation, coaching and a saved improvement goal.

## Financial rules

- Validate money, dates and quantities at all input boundaries. Use RM for displayed amounts and integer cents for money arithmetic.
- Calculate financial totals with deterministic TypeScript functions. Give Qwen precomputed comparisons and use the returned text for interpretation.
- Keep cash paid for ingredients distinct from estimated costs per unit. Recorded cash surplus subtracts each recorded cash outflow once.
- Use an unavailable state for missing unit cost or an undefined ratio. Document the quantity and cost assumptions of each simulation.
- Use only fictional sample figures during the judging demo.

## Architecture and conventions

- Keep React presentation, lesson content, calculation logic, storage and provider integration separate.
- Preserve the typed localStorage interface. Read existing browser state defensively and scope reset actions to the sample workspace.
- Share request and response schemas across the web and API boundaries. Validate provider results and use the labeled demo fallback on failure.
- Set model credentials through backend environment variables. Keep secrets out of source, logs, browser bundles and screenshots.
- Use strict TypeScript and small, readable modules. Before submitting a change, run the tests and build and exercise the affected user journey. Record what was actually verified.
- Add genuine assistant contributions to the judging evidence only when they can be attributed to a real team member and artifact.
