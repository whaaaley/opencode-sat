## Testing Standards

### General Practices

Generate mock data with @faker-js/faker instead of hand-writing test fixtures. Faker
produces realistic data distributions that catch edge cases static fixtures miss.

Create shared test dependencies in beforeAll blocks. Tests that set up their own
prerequisites are slower and produce redundant database rows.

Order test cases within each file as create, read, update, list, delete. This mirrors CRUDL
order and ensures earlier tests produce the data that later tests consume.

Never mark a task complete until the full test suite passes one final time. A passing
individual test means nothing if it broke something elsewhere.

### Test Isolation

Always test through the API layer — never import database tables, ORM instances, or
internal modules directly into test files. Tests that reach into implementation internals
create circular verification: you end up testing that your query returns what your query
returns.

Verify mutations by calling a read endpoint after the write. If the read returns the
expected state, the write worked. Do not query the database directly to confirm.

If you need to verify something and no endpoint exists for it, that is a signal to create a
new endpoint — not to add a raw query to the test file.

### Integration Testing

Use real database instances for integration tests, not in-memory substitutes. SQLite and
in-memory databases do not enforce the same constraints, triggers, and type coercions that
PostgreSQL does. Tests that pass against SQLite and fail against Postgres are worthless.

Use the createTestContext() utility for consistent test setup. It handles authentication,
database seeding, and cleanup automatically.

### Running Tests

Run the full suite with npm test. Run a single file with npm test -- --filter "filename".
Isolate a specific test with --filter "test name".

When tests fail due to connection errors, restart the database container:
docker compose restart postgres. Connection pool exhaustion is the most common cause of
flaky test failures in CI.
