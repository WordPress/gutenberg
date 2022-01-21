# Full post content test fixtures

## Introduction

This directory contains sets of fixture files that are used to test the parsing
and serialization logic.

Each test is made up of four fixture files:

1. `fixture-name.html`: The initial post content.
2. `fixture-name.parsed.json`: The **expected** output of the PEG parser for
   this content (checked against the **actual** output of both the JS and PHP
   versions of the parser).
3. `fixture-name.json`: The **expected** representation of the block(s) inside
   the post content, along with their attributes and any nested content. The
   contents of this file are compared against the **actual** block object(s).
4. `fixture-name.serialized.html`: The **expected** result of calling
   `serialize` on the parsed block object(s). The contents of this file are
   compared against the **actual** re-serialized post content. This final step
   simulates opening and re-saving a post.

Every block is required to have at least one such set of fixture files to test
the parsing and serialization of that block. Additionally, each deprecation for
a block should also have a fixture.

These fixtures must be named like
`core__blockname{__*,}.{html,json,serialized.html}`. For example, for the
`core/image` block, the following four fixture files must exist:

1. `core__image.html` (or `core__image__specific-test-name.html`). Must
   contain a `<!-- wp:core/image -->` block.
2. `core__image.parsed.json` (or `core__image__specific-test-name.parsed.json`).
3. `core__image.json` (or `core__image__specific-test-name.json`).
4. `core__image.serialized.html` (or
   `core__image__specific-test-name.serialized.html`).

Ideally all important attributes and features of the block should be tested
this way. New contributions in the form of additional test cases are always
welcome - this is a great way for us to identify bugs and prevent them from
recurring in the future.

## Creating Fixtures

When adding a new fixtures, only the first file above (1, e.g. `core__image.html`) needs
to be created manually, the other files are generated from this first file.

To create the first file:

1. Create a file with the correct name in this folder.
2. Add the block to an new post in the editor.
3. Toggle the block attributes to desired settings for the test.
4. Switch to the code editor view and copy the block markup.
5. Paste the markup into the file you created at step 1.

Next, to generate files (2) through (4) run the following command from the root of the
project:

```sh
pnpm fixtures:regenerate test/integration/full-content/full-content.test.js
```

When using this command, please be sure to manually verify that the
contents of the `.json` and `.serialized.html` files are as expected.

In particular, check that the `isValid` property is `true`, and that
the attributes are serialized correctly.

## Updating Fixtures

The process for updating fixtures for existing tests is similar to that for creating them:

Run the command to regenerate the files:

```sh
pnpm fixtures:regenerate test/integration/full-content/full-content.test.js
```

After regenerating fixtures, check the diff (using git/github) to check that the changes were expected
and the block is still valid (`isValid` is `true`).

## Related

See the
[`full-content.test.js`](../../../../test/integration/full-content/full-content.test.js)
test file for the code that runs these tests.
