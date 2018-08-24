## v2.0.0 (Unreleased)

- Breaking: `dispatch("core").receiveTerms` has been deprecated. Please use `dispatch("core").receiveEntityRecords` instead.
- Breaking: `getCategories` resolvers has been deprecated. Please use `getEntityRecords` resolver instead.
- Breaking: `select("core").getTerms` has been deprecated. Please use `select("core").getEntityRecords` instead.
- Breaking: `select("core").getCategories` has been deprecated. Please use `select("core").getEntityRecords` instead.
- Breaking: `wp.data.select("core").isRequestingCategories` has been deprecated. Please use `wp.data.select("core/data").isResolving` instead.
- Breaking: `select("core").isRequestingTerms` has been deprecated. Please use `select("core").isResolving` instead.