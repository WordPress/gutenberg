# Optional internal Vitest rules

This records step 4 of [#83089](https://github.com/WordPress/gutenberg/issues/83089), following [#83502](https://github.com/WordPress/gutenberg/pull/83502), [#83572](https://github.com/WordPress/gutenberg/pull/83572) and [#83620](https://github.com/WordPress/gutenberg/pull/83620). Public `@wordpress/eslint-plugin` defaults are outside this change.

## Adopted rule

Enable `vitest/prefer-import-in-mock` for JavaScript unit tests and shared helpers. A string passed to `vi.mock()` or `vi.doMock()` is invisible to `import/no-unresolved`. Using `import()` lets that existing rule catch misspelled or moved module paths, including in JavaScript files that are not typechecked. The cleanup changes 72 mock paths in 41 files without changing their factories or hoisting behavior. Three existing mocks target unexported package internals; they now use relative source paths so the lint resolver can check the same modules that Vitest mocks.

TypeScript keeps the existing `typescript-vi-mock` convention in `vitest-policy-rules.mjs`. The plugin is not an equivalent replacement: it accepts nonliteral arguments and misses an alias of a Vitest namespace that the convention validator rejects. The new ESLint rule therefore applies only to JavaScript. TypeScript `vi.doMock()` is outside the existing convention and remains unchanged; expanding that policy is a separate decision.

The two plugin limitations documented in step 3 remain local: the lock tests' intervening assignment before `Promise.all`, and the console setup's awaited `aroundEach` callback. This audit does not change those exceptions or the already enabled `require-awaited-expect-poll` rule.

## Audit and deferred rules

The September 29, 2026 audit used trunk `9679b5dc9fa587c0e56422e833895c2cacc649ae`, ESLint 10.10.0 and locked `@vitest/eslint-plugin` 1.6.27. It applied candidate rules through the full repository configuration to 1,241 discovered tests and matching helpers and infrastructure files, preserving inline directives. The counts below are diagnostics, not confirmed defects. The audit ran 60 currently inactive rules with default options; it did not use `configs.all`. The type-aware `unbound-method` rule was assessed separately because this configuration does not provide TypeScript parser services.

| Rule or group | Decision |
| --- | --- |
| `prefer-import-in-mock` | Enable for JavaScript. The trial found 76 diagnostics: 72 JavaScript mock paths and four TypeScript `vi.doMock()` calls. Keep the existing TypeScript convention as described above. |
| `consistent-test-filename`, `prefer-importing-vitest-globals` | Defer. Test discovery, explicit Vitest imports, aliases and shadowed bindings already belong to the routing and convention validators. The latter rule reports 77 diagnostics in the parser helper, which receives its test APIs through an explicit runner argument. No equivalent coverage was established to replace those validators. |
| `no-conditional-tests` | Defer. Its 13 diagnostics include valid fixed-variant registration and a false positive on `RegExp.test()` in `core-data`'s store tests. |
| `no-conditional-in-test` | Defer. Its 52 diagnostics include conditional setup and fixture handling. Step 2 already prevents conditional assertions; banning every branch would also reject legitimate test logic. |
| `no-duplicate-hooks`, `require-hook` | Defer. Nine duplicate-hook diagnostics include independent global-mock helper registrations. The 268 `require-hook` diagnostics include module-level setup. Neither trial establishes a lifecycle defect that justifies restructuring valid helpers. |
| `no-test-return-statement` | Defer. Its 117 diagnostics include returned promises that Vitest waits for. This would conflict with the valid returned-assertion patterns preserved in step 3. |
| `prefer-vi-mocked`, `require-mock-type-parameters` | Defer. The 56 cast diagnostics include existing `vi.mocked()` calls narrowed to a specific generic store signature. Replacing all casts is not necessarily equivalent. Requiring mock type arguments adds 3,147 diagnostics and rejects useful inference. |
| `require-to-throw-message` | Defer. Its 19 diagnostics include tests of rejection contracts that intentionally do not fix the error message, such as unsupported theme seed colors. Error-specific assertions remain a case-by-case test decision. |
| `unbound-method` | Defer. It needs type-aware linting and an audit of its interaction with the base TypeScript rule. Enabling parser services across the repository is outside this lint-rule change. |
| `no-hooks`, `no-importing-vitest-globals` | Reject. These conflict with the repository's hook and explicit-import conventions. |
| `no-restricted-matchers`, `no-restricted-vi-methods` | Leave unconfigured. No additional forbidden matcher or API was identified. |
| Naming, formatting, ordering and matcher preferences | Defer. `consistent-each-for`, `consistent-test-it`, `consistent-vitest-vi`, `hoisted-apis-on-top`, the `padding-around-*` rules and remaining `prefer-*` rules primarily rewrite accepted style. For example, `prefer-called-once` reports 761 diagnostics, `prefer-strict-equal` 3,511, and `prefer-to-be` 645. A large matcher or formatting rewrite is outside this step. |
| Blanket limits and required test structure | Defer `max-expects`, `max-nested-describe`, `no-large-snapshots`, `prefer-expect-assertions`, `require-test-timeout` and `require-top-level-describe`. Defaults impose arbitrary limits, redundant assertion counts or extra structure without a demonstrated coverage gain. |
| `warn-todo` | Leave disabled. The trial found no diagnostics; adding a warning does not resolve or track an actual unfinished test. Existing disabled-test warnings remain unchanged. |

## Review context

The earlier PRs required preserving assertion coverage, documenting newly enabled errors, and keeping valid type-only tests and assertion helpers supported. Review of #83620 favored ordinary inline callbacks and explicit promise returns over file-exception lists. This change follows that approach: it adds one JavaScript rule, retains the existing TypeScript owner, and introduces no new suppression or exception.
