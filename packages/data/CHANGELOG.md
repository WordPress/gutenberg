## v2.0.0 (Unreleased)

- Breaking: The `withRehdyration` function is removed. Use the persistence plugin instead.
- Breaking: The `loadAndPersist` function is removed. Use the persistence plugin instead.
- Breaking: `registerSelectors`, `registerActions`, and `registerResolvers` will merge into the existing set of selectors, actions, and resolvers, if any exist (previously replaced all except those matching keys of the new set). This is intended to facilitate extensibility of singular function handlers.
