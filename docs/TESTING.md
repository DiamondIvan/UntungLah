# Verification checklist

Run from the repository root.

```sh
npm test
npm run build
npm run dev
```

Use the automated tests for currency formatting, financial operations, edge cases, storage, quiz scoring and coach response handling. The browser checklist below covers integration behavior that needs a running app.

Run `npm run test:browser` with a built app serving at `http://127.0.0.1:3001` and Microsoft Edge installed. The script opens clean desktop and mobile contexts, creates a fictional business, checks sample reset isolation and follows the guided journey through a saved and completed goal. Set `UNTUNGLAH_TEST_URL` to use a different origin, or `UNTUNGLAH_BROWSER=chrome` to launch Google Chrome. Set `CAPTURE_SCREENSHOTS=1` to refresh the screenshot set in `docs/screenshots/`.

The MVP verification run passed all 14 automated checks, the production build, and the Edge workflow against both the development and built app. The workflow covered sample reset isolation, goal completion after refresh, and the labeled coach fallback. The provider path was checked with a mocked client. A live Model Studio check requires the team’s Qwen configuration.

## Browser checks

1. Open the Vite URL printed by the terminal. Check `GET /api/health` and confirm the web console has no critical errors.
2. Load the sample workspace. Verify RM200 revenue, RM140 outflows, RM60 cash surplus and RM2 unit contribution.
3. Add a sample sale of two packs at RM5 each. Confirm revenue and cash surplus each increase by RM10. Refresh, confirm the record survives, then delete it and verify the starting figures return.
4. Check that malformed dates, negative prices and blank required fields cannot be saved. Create a business with unknown unit cost and confirm the relevant calculation shows an unavailable state.
5. Open **Pricing Strategy**. Answer an item incorrectly to see its explanation, finish the quiz, retry and check the saved score after refresh.
6. Set price to RM5.50 in the practice scenario while holding unit cost at RM3 and quantity at 40. Verify RM220 revenue, RM120 variable cost, RM100 estimated gross contribution and RM20 improvement over baseline. At zero units, revenue and total contribution should be zero.
7. In the ingredient-cost scenario, test a rise from RM3 to RM3.50 at RM5 and 40 units. Estimated gross contribution should be RM60. Reducing sales volume should update the totals immediately.
8. With no Qwen credentials, request an explanation and verify the demo source label. With a configured provider, repeat and verify a live Qwen response before presenting it as live.
9. Save a suggested action, refresh and check that it appears under **My Progress**. Complete it and verify the status persists.
10. Follow **Start Guided Demo** from opening the sample business to the saved goal. Check the route and forms at desktop and mobile widths. Reset the sample workspace and verify it restores seed records and resets its progress.

## Built app

Stop the development servers and run `npm start` after a successful build. Open [http://localhost:3001](http://localhost:3001), check the dashboard and repeat a coach request. This verifies the API and compiled frontend share the production origin.
