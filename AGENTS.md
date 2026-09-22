<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Code Style Guidelines: Clarity & Readability

## Core Rule

Prioritize explicit, readable, and straightforward code over brevity. Always write code using basic, self-explanatory syntax, even if it requires more lines.

## Guidelines

### 1. Avoid Short-Circuiting & Clever Operators

- **No Ternaries:** Use standard `if / else` statements instead of ternary operators (`a ? b : c`).
- **No Logical Short-Circuits:** Do not use `&&` or `||` to control execution flow or assign default values.
    - **Incorrect:** `user && sendNotification(user)`
    - **Correct:**
        ```ts
        if (user) {
            sendNotification(user)
        }
        ```
- **No Nullish Coalescing (`??`) for Control Flow:** Explicitly check for `null` or `undefined`.

### 2. Prefer Standard Function Declarations

- Prefer standard `function` declarations over arrow functions for top-level functions, export handlers, and utility functions.
- Avoid concise-body arrow functions without braces or `return` statements.
- Use arrow functions primarily for inline callbacks where standard `function` keywords are unconventional, but always write full block bodies with explicit `return` statements.
    - **Incorrect:**
        ```ts
        const add = (a: number, b: number) => a + b
        ```
    - **Correct:**
        ```ts
        function add(a: number, b: number) {
            return a + b
        }
        ```

### 3. Clear Loops & Iteration

- Use standard `for...of` loops instead of complex or chained array methods (`map`, `filter`, `reduce`) when performing multi-step operations.
- Keep array method callbacks simple and fully expanded with descriptive parameter names.

### 4. Explicit Object & Type Handling

- Do not use deep inline destructuring in function parameter signatures.
- Accept the parent object or context parameter first, then access or extract properties inside the function body.
    - **Incorrect:** `function handle({ user: { id } })`
    - **Correct:**
        ```ts
        function handle(context: Context) {
            const userId = context.user.id
        }
        ```

### 5. Naming & Verbosity

- Avoid single-letter variable names (except standard loop indices like `i`).
- Use descriptive, spelled-out variable and parameter names.
- Write out explicit type definitions on separate lines using `interface` or `type` rather than dense inline types.
