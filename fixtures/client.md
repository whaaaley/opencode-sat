## Frontend Development

### Stack

The client is built with React 19, TypeScript, Vite, and Tailwind CSS. State management
uses Zustand for global state and TanStack Query for server state. The dev server runs on
port 3000.

### Component Patterns

Write components as named function exports using arrow function syntax. Default exports are
not allowed because they make refactoring and import tracking unreliable.

Props must be typed with a Props type alias defined directly above the component. Never use
React.FC or React.FunctionComponent — they add children implicitly and have been deprecated
in community practice since React 18.

Prefer computed values and useMemo over useEffect for derived state. Effects that
synchronize derived values are a code smell — they cause unnecessary re-renders and
introduce timing bugs.

Use refs for DOM access and imperative handles only. Never store application state in refs
because mutations to ref.current do not trigger re-renders.

### Data Fetching

TanStack Query v5 removed onSuccess callbacks from useQuery. Handle success states with
useEffect watching the data value instead. Mutation callbacks (onSuccess, onError,
onSettled) still work normally.

Use isFetching for query loading indicators and isPending for mutation loading indicators.
When a component uses both, combine them: isFetching || isPending.

### Styling

Use Tailwind utility classes for all styling. Do not write custom CSS files or use inline
style objects. Component variants should use class-variance-authority (cva) through computed
className values.

Prefer grid and flex layouts with gap properties for spacing. Avoid margin utilities for
layout spacing — they create fragile one-directional dependencies between sibling elements.

### Accessibility

Follow WCAG 2.1 AA for all text contrast on dark backgrounds. The minimum text color on
zinc-900 backgrounds is zinc-300 (5.27:1 ratio). Never use zinc-400 or darker for readable
text — reserve those only for decorative elements, disabled states, or placeholder text.

All interactive elements must have visible focus indicators. Keyboard navigation must work
for every flow that works with a mouse.
