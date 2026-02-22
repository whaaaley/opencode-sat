# OpenCode SAT (Speech Act Theory)

An OpenCode plugin that converts unstructured text into structured, consistent formats using speech act theory.

<img width="612" height="256" alt="Rule formatting table output" src="https://github.com/user-attachments/assets/51edf4b5-831a-4e13-96de-8cad453ea13e" />

## Quick Start

Add the plugin to your `opencode.json` and restart OpenCode:

```json
{
  "plugin": ["opencode-sat"]
}
```

Then just tell OpenCode what you want:

```
Rewrite my instruction files
Add a rule about using early returns
```

Messy or voice-transcribed input can be restructured into a clear task hierarchy using the `refine-prompt` tool.

## Tools

For the theory behind the plugin, see [Theoretical Foundation](#theoretical-foundation).

### rewrite-instructions

Rewrites all matched instruction files through the parse/format pipeline. Discovers files from the `instructions` array in your `opencode.json`. Accepts an optional `mode` (`verbose`, `balanced`, or `concise`, default `balanced`) and an optional `files` string of comma-separated paths to process specific files instead of running discovery.

```
rewrite-instructions
rewrite-instructions [mode=concise]
rewrite-instructions [files=fixtures/testing.md]
rewrite-instructions [files=a.md,b.md, mode=verbose]
```

**Input:**
```
Always use return await when returning promises from async functions. This provides
better stack traces and error handling. Arrow functions are the standard function
syntax. Do not use function declarations or function expressions because arrow
functions provide lexical this binding and a more compact syntax.
```

**verbose** - Full Rule/Reason pairs for every rule.
```
Rule: Always use return await when returning promises from async functions.
Reason: Provides better stack traces and error handling.

Rule: Use arrow functions as the standard function syntax.
Reason: Arrow functions provide lexical this binding and a more compact syntax.

Rule: Never use function declarations or function expressions.
Reason: Arrow functions are the standard syntax for the project.
```

**balanced** (default) - The LLM decides which rules need reasons.
```
Rule: Always use return await when returning promises from async functions.
Reason: Provides better stack traces and error handling.

Rule: Use arrow functions as the standard function syntax.

Rule: Never use function declarations or function expressions.
Reason: Arrow functions provide lexical this binding and a more compact syntax.
```

**concise** - Bullet list of directives only, no reasons.
```
- Always use return await when returning promises from async functions.
- Use arrow functions as the standard function syntax.
- Never use function declarations or function expressions.
```

### add-instruction

Appends new rules to the end of an instruction file without rewriting existing content. Takes an `input` string of unstructured rule text to parse, format, and append. Accepts an optional `file` path (defaults to the first discovered instruction file) and an optional `mode` (`verbose`, `balanced`, or `concise`, default `balanced`).

```
add-instruction [input=Always use early returns]
add-instruction [input=Use early returns, mode=concise]
add-instruction [input=Use early returns, file=docs/rules.md]
```

### automatic-rule

Detects when the user corrects the agent or expresses a coding preference, extracts the implicit rule, and appends it to the instruction file. This tool is invoked automatically by the LLM, not by the user. Takes an `input` string of the user's correction or feedback. Accepts an optional `file` path (defaults to the first discovered instruction file).

```
automatic-rule [input=Don't use semicolons in this project]
automatic-rule [input=I prefer early returns, file=docs/rules.md]
```

### refine-prompt

Restructures messy or unstructured user input into a clear task hierarchy. Takes an `input` string of raw text (often from voice transcription) and decomposes it into structured tasks with intent, targets, constraints, context, and recursive subtasks.

```
refine-prompt [input=refactor the search module add guards to each provider make sure bsky and wiki get validated then run the tests]
```

Output:
```
┌ 1. Refactor the search module
│    > Targets: src/search.ts, src/providers/
│    > Constraints: use safeAsync, no optional chaining
│    > Context: Current error handling is inconsistent
│
├──┬ 2. Add guards to providers
│  │    > Targets: src/providers/
│  │    > Constraints: use isRecord helper
│  │
│  ├─── 3. Validate bsky responses
│  │       > Targets: bsky-search.ts
│  │
│  └─── 4. Validate wiki responses
│          > Targets: wiki-search.ts
│
├─── 5. Update error handling
│       > Targets: src/utils/safe.ts
│
└─── 6. Run the tests
        > Constraints: fix any failures
```

## Theoretical Foundation

The plugin is built on [speech act theory](https://en.wikipedia.org/wiki/Speech_act) (Austin, Searle). All instructions are **directives**: speech acts that get the hearer to do something. But directives come in two forms, and each needs a different formal framework.

### Rule Formatting (deontic logic, regulative directives)

Rules constrain ongoing behavior. They are standing obligations, prohibitions, and permissions that persist across all future actions. The formal framework is [deontic logic](https://en.wikipedia.org/wiki/Deontic_logic): what is obligatory, forbidden, and permissible.

The plugin parses unstructured rule text into structured components:

```ts
type ParsedRule = {
  strength: 'obligatory' | 'forbidden' | 'permissible' | 'optional' | 'supererogatory' | 'indifferent' | 'omissible'
  action: string
  target: string
  context?: string
  reason: string
}
```

### Prompt Formatting (action/planning logic, performative directives)

Prompts request a specific one-shot action. They are not standing rules but immediate instructions. The formal framework is closer to [action languages](https://en.wikipedia.org/wiki/Action_language) from AI planning (STRIPS, ADL, HTN): what the goal is, what must be true before acting, and what changes after.

A messy user prompt typically mixes three levels together:

- **Goal** (desired end state): "I want search results to show up in chat"
- **Tasks** (what to do): "add a postResult call, update the providers"
- **Constraints** (conditions/preferences): "don't break existing tests, use safeAsync"

The plugin parses raw input into structured components:

```ts
type ParsedTask = {
  intent: string
  targets: Array<string>
  constraints: Array<string>
  context?: string
  subtasks: Array<ParsedTask>
}
```

The schema is recursive. A `ParsedTask` can contain subtasks, which can contain their own subtasks. This follows the HTN (Hierarchical Task Network) model where compound tasks decompose into subtask trees.

## Disclaimer

I'm not an NLP expert. I stumbled onto speech act theory and deontic logic while researching NLP and thought it could be a good fit for structuring instructions. The implementation may not perfectly align with academic definitions, but the goal is practical utility.

## License

MIT
