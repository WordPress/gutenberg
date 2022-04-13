# Docgen Fixtures

These fixtures are the "input" for various docgen tests.

The easiest way to generate them is using a tool like [AST Explorer](https://astexplorer.net/). Put in the code you'd like to write a test for and copy the generated JSON.

Use the `@babel/parser` for JavaScript language and change the settings to disable the `flow` plugin and enable the `typescript` plugin. The rest can be left as is. The Gutenberg project is extremely conservative when it comes to using non-standard syntax so it is unlikely that you will need to enable any of the experimental syntax features in the babel parser.

Once you've got the AST, create a new directory for the particular syntax being described in the [`fixtures`](.) directory. Note: if you're writing tests for `getTypeAnnotation`, those fixtures go in the [`fixtures/type-annotations`](./type-annotations) directory.

In the directory include an plain JavaScript or TypeScript file with the sample code used to derive the AST JSON (like `example.ts` or `code.js`). For `getTypeAnnotation` tests create a `get-node.js` file that exports a function that returns the AST as a JavaScript object and write a test in the same style as the existing ones in [`get-type-annotation.js`](./../get-type-annotation.js). For other tests, create a plain JSON file with the AST and `require` it inline during the test.

The differences between the format for the fixtures for `getTypeAnnotation` tests and the rest of the tests are due to the `getTypeAnnotation` tests sometimes modifying the AST returned by the `get-node` module via parameters passed to `getNode` function. See [this fixture](./type-annotations/simple-types/get-node.js) as an example of this practice. This allows testing multiple edge cases of very similar AST without creating individual JSON files for each variation.
