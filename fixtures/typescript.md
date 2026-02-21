## TypeScript Standards

### Type Safety

Never use non-null assertions (!) anywhere in the codebase. They bypass the type checker
and hide potential null reference bugs at runtime. Similarly, avoid type assertions (as)
since they tell the compiler to trust you instead of verifying correctness.

Use type declarations exclusively — never interface declarations. Types support unions,
intersections, and mapped types which interfaces cannot express. This keeps the type
system consistent across the project.

Arrow functions are the standard function syntax. Do not use function declarations or
function expressions. Arrow functions provide lexical this binding and a more compact
syntax that reduces visual noise.

Always write `return await` when returning a promise from an async function. Dropping the
await silently swallows stack frames in error traces, making production debugging harder.

### Error Handling

For CLI validation errors use console.error() followed by a return statement. Never throw
exceptions for user input mistakes — stack traces confuse end users and pollute logs.

System-level errors from file I/O, network calls, and dynamic imports should be wrapped in
try/catch blocks. These are unpredictable failures that need structured recovery paths.

### Code Style

Use line comments (//) exclusively. Block comments (/* */) are prohibited because they
create inconsistent visual patterns and are harder to toggle in editors.

Boolean properties that describe reactive state use adjective prefixes: is, has, are, can,
should. Examples: isLoading, hasPermission, canSubmit. Boolean functions that accept
arguments use verb phrases without prefixes: matchesFilter(item), containsKey(map, key).

Keep function parameters on a single line unless they exceed the configured line width.
Multi-line parameter lists are only acceptable when the formatter forces a break.

Define callback functions as named const arrow functions before passing them to higher-order
functions. Inline anonymous callbacks are harder to debug and cannot be reused.

Empty early returns require a comment explaining why the function exits. A bare return
statement with no explanation forces the reader to reverse-engineer the intent.
