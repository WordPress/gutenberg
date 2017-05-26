## Full post content test fixtures

This directory contains sets of fixture files that are used to test the parsing
and serialization logic.

Each test is made up of three fixture files:

1. `fixture-name.html`: The initial post content.
2. `fixture-name.json`: The **expected** parsed representation of the block(s)
   inside the post content, along with their attributes and any nested content.
   The contents of this file are compared against the **actual** parsed block
   object(s).
3. `fixture-name.serialized.html`: The **expected** result of calling
   `serialize` on the parsed block object(s).  The contents of this file are
   compared against the **actual** re-serialized post content.  This final step
   simulates opening and re-saving a post.

Every block is required to have at least one such set of fixture files to test
the parsing and serialization of that block.  These fixtures must be named like
`core-blockname{-*,}.{html,json,serialized.html}`.  For example, for the
`core/image` block, the following three fixture files must exist:

1. `core-image.html` (or `core-image-specific-test-name.html`).  Must contain a
   `<!-- wp:core/image -->` block.
2. `core-image.json` (or `core-image-specific-test-name.html`).
3. `core-image.serialized.html` (or
   `core-image-specific-test-name.serialized.html`).

Ideally all important attributes and features of the block should be tested
this way.  New contributions in the form of additional test cases are always
welcome - this is a great way for us to identify bugs and prevent them from
recurring in the future.

When adding a new test, it's only necessary to create file (1) above, then
there is a command you can run to generate (2) and (3):

```sh
GENERATE_MISSING_FIXTURES=y npm run test-unit -- --grep 'full post content fixture'
```

However, when using this command, please be sure to manually verify that the
contents of the `.json` and `.serialized.html` files are as expected.

See the
[`full-content.js`](../full-content.js)
test file for the code that runs these tests.
