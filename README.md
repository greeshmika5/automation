# Automation Assignment Repository

## Structure


- **Week-1-QA-Excellence/**: QA Excellence Assignment (docs, RTM, clarifications)
- **Week-2-PetStore-UI-API/**: Pet Store API & Swag Labs UI Automation (test cases, matrix, Playwright UI tests)
- **Week-3-SweetShop/**: Sweet Shop UI & API Automation (Playwright tests, reports, test data, docs)

## How to Run

1. Install dependencies:
   ```
npm install
   ```
2. Run all Playwright tests:
   ```
npx playwright test
   ```
3. Run only Week 2 Swag Labs UI tests:
   ```
npx playwright test Week-2-PetStore-UI-API/saucedemo-ui.spec.ts
   ```
4. Run only Week 3 UI tests:
   ```
npx playwright test Week-3-SweetShop/tests
   ```
5. Run only Week 3 API tests:
   ```
npx playwright test Week-3-SweetShop/api-tests
   ```
6. View reports:
   ```
npx playwright show-report
   ```

