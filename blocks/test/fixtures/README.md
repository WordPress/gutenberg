## Full post content test fixtures

This directory contains sets of fixture files that are used to test the parsing
and serialization logic.

Each test is made up of four parts:

1. Fixture file `fixture-name.html`: The initial post content.
2. The **expected** output of the PEG parser for
   this content (checked against the **actual** output of both the JS and PHP
   versions of the parser).
3. The **expected** representation of the block(s) inside
   the post content, along with their attributes and any nested content.  The
   contents of this file are compared against the **actual** block object(s).
4. The **expected** result of calling
   `serialize` on the parsed block object(s).  The contents of this file are
   compared against the **actual** re-serialized post content.  This final step
   simulates opening and re-saving a post.

Every block is required to have at least one such set of tests to verify
the parsing and serialization of that block.  These fixtures must be named like
`core__blockname{__*,}.html`.  For example, for the
`core/image` block, the following fixture file must exist:

`core__image.html` (or `core__image__specific-test-name.html`). Must contain
a `<!-- wp:core/image -->` block.

Ideally all important attributes and features of the block should be tested
this way. New contributions in the form of additional test cases are always
welcome - this is a great way for us to identify bugs and prevent them from
recurring in the future.

When adding a new test, it's only necessary to create file (1) above, then
Jest will generate snapshots for (2) through (4). Please be sure to manually verify that the
contents of the snapshots are as expected.

See the
[`full-content.js`](../full-content.js)
test file for the code that runs these tests.
