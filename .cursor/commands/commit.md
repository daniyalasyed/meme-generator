Before committing, follow these steps in order:

## Step 1: Identify Changed Files
Look at the git diff to see what files were modified, added, or deleted.

## Step 2: Generate or Update Tests
For each changed file that contains testable code (functions, components, utilities):
- If a `.test.ts` or `.test.tsx` file exists next to it, update the tests to cover the changes
- If no test file exists, create one with appropriate test cases
- Skip test generation for:
  - Configuration files (next.config.ts, tsconfig.json, etc.)
  - Type definition files (.d.ts)
  - CSS/styling files
  - Files that only contain types/interfaces

## Step 3: Run Tests
Run `npm test` to verify all tests pass.
- If tests fail, fix the issues before proceeding
- Do not commit if tests are failing

## Step 4: Commit
Once all tests pass, commit the changes (including any new or updated test files) with a short but meaningful commit message that references the code changes.