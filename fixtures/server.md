## Backend Development

### Stack

The server runs on Node.js with Fastify, Drizzle ORM, PostgreSQL, and Zod for validation.
Redis handles caching and pub/sub for real-time event streaming. Read package.json for
available scripts and dependencies.

### Database Queries

Never add limit() to insert, delete, or returning operations. Drizzle generates invalid SQL
when limit is applied to these statements.

Use .returning({ id: table.id }) after mutations to return only the ID for verification.
Returning full rows after writes exposes unnecessary data and increases payload size.

Include limit(1) when selecting or updating a single row. Without it the database scans
more rows than necessary.

Order join conditions with the foreign key column first and the primary key column second:
eq(childTable.parentId, parentTable.id). This convention makes relationship direction
immediately readable.

Keep query methods in CRUDL order: create, read, update, delete, list. Consistent ordering
across repository files reduces cognitive load when navigating the codebase.

### Field Types

Use text() for unbounded content like messages, descriptions, and document bodies. Use
varchar() with power-of-2 lengths for bounded fields: varchar(32) for tokens, varchar(64)
for enum values, varchar(128) for external IDs, varchar(256) for names and emails,
varchar(512) for URLs. Never use arbitrary lengths like 50, 100, or 255 — power-of-2 values
optimize memory alignment.

### Constraint Naming

PostgreSQL truncates constraint names longer than 63 characters. Use snake_case following
the pattern: tablename_columnname_constrainttype. Foreign keys use the suffix _fk, unique
constraints use _unique, and check constraints use _check.

### Error Handling

Wrap every public function body in try/catch with handleError for consistent error
propagation. Use StreamError for user input failures (400), ResourceError for missing
entities (404), ConstraintError for database violations (400), and InternalError for
unexpected failures (500).

### Repository Functions

Use the non-nullable getX variant when the resource must exist — it throws ResourceError
automatically. Use the nullable getXNullable variant only when absence is legitimate, like
checking if a duplicate exists before creation. Never combine getXNullable with a manual
null check and throw when getX already does that.
