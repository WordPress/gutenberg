# Overusing snapshots

Take a look at the below code. Could you understand what the test is trying to do at first glance?

```js
await editor.insertBlock( { name: 'core/quote' } );
await page.keyboard.type( '1' );
await page.keyboard.press( 'Enter' );
await page.keyboard.press( 'Enter' );

expect( await editor.getEditedPostContent() ).toMatchSnapshot();

await page.keyboard.press( 'Backspace' );
await page.keyboard.type( '2' );

expect( await editor.getEditedPostContent() ).toMatchSnapshot();
```

This is borrowed from the real code in gutenberg, with the test title and the comments removed and refactored into Playwright. Ideally, E2E tests should be self-documented and readable to end users; in the end, they are trying to resemble how end users interact with the app. However, there are a couple of red flags in the code.

## Problems with snapshot testing

Popularized by Jest, [snapshot testing](https://jestjs.io/docs/snapshot-testing) is a great tool to help test our app _when it makes sense_. However, probably because it's so powerful, it's often overused by developers. There are already multiple [articles](https://kentcdodds.com/blog/effective-snapshot-testing) about this. In this particular case, snapshot testing fails to reflect the developer's intention. It's not clear what the assertions are about without looking into other information. This makes the code harder to understand and creates a mental overhead for all the other readers other than the one who wrote it. As readers, we have to jump around the code to fully understand them. The added complexity of the code discourages contributors from changing the test to fit their needs. It could sometimes even confuse the authors and make them accidentally [commit the wrong snapshots](https://github.com/WordPress/gutenberg/pull/42780#discussion_r949865612).

Here's the same test with the test title and comments. Now you know what these assertions are actually about.

```js
it( 'can be split at the end', async () => {
	// ...

	// Expect empty paragraph outside quote block.
	expect( await getEditedPostContent() ).toMatchSnapshot();

	// ...

	// Expect the paragraph to be merged into the quote block.
	expect( await getEditedPostContent() ).toMatchSnapshot();
} );
```

The developer's intention is a bit more readable, but it still feels disconnected from the test. You might be tempted to try [inline snapshots](https://jestjs.io/docs/snapshot-testing#inline-snapshots), which do solve the issue of having to jump around files, but they're still not self-documented nor explicit. We can do better.

## The solution

Instead of writing the assertions in comments, we can try directly writing them out explicitly. With the help of `editor.getBlocks`, we can rewrite them into simpler and atomic assertions.

```js
// ...

// Expect empty paragraph outside quote block.
await expect.poll( editor.getBlocks ).toMatchObject( [
	{
		name: 'core/quote',
		innerBlocks: [
			{
				name: 'core/paragraph',
				attributes: { content: '1' },
			},
		],
	},
	{
		name: 'core/paragraph',
		attributes: { content: '' },
	}
] );

// ...

// Expect the paragraph to be merged into the quote block.
await expect.poll( editor.getBlocks ).toMatchObject( [ {
	name: 'core/quote',
	innerBlocks: [
		{
			name: 'core/paragraph',
			attributes: { content: '1' },
		},
		{
			name: 'core/paragraph',
			attributes: { content: '2' },
		},
	],
} ] );
```

These assertions are more readable and explicit. You can add additional assertions or split existing ones into multiple ones to highlight their importance. Whether to keep the comments is up to you, but it's usually fine to omit them when the code is already readable without them.

## Snapshot variants

Due to the lack of inline snapshots in Playwright, some migrated tests are using string assertions (`toBe`) to simulate similar effects without having to create dozens of snapshot files.

```js
expect( await editor.getEditedPostContent() ).toBe( `<!-- wp:paragraph -->
<p>Paragraph</p>
<!-- /wp:paragraph -->` );
```

We can consider this pattern as a variant of snapshot testing, and we should follow the same rule when writing them. It's often better to rewrite them using `editor.getBlocks` or other methods to make explicit assertions.

```js
await expect.poll( editor.getBlocks ).toMatchObject( [ {
	name: 'core/paragraph',
	attributes: { content: 'Paragraph' },
} ] );
```

## What about test coverage?

Comparing the explicit assertions to snapshot testing, we're definitely losing some test coverage in this test. Snapshot testing is still useful when we want to assert the full serialized content of the block. Fortunately, though, some tests in the integration test already assert the [full content](https://github.com/WordPress/gutenberg/blob/trunk/test/integration/fixtures/blocks/README.md) of each core block. They run in Node.js, making them way faster than repeating the same test in Playwright. Running 273 test cases in my machine only costs about 5.7 seconds. These sorts of tests work great at the unit or integration level, and we can run them much faster without losing test coverage.

## Best practices

Snapshot testing should rarely be required in E2E tests, often there are better alternatives that leverage explicit assertions. For times when there isn't any other suitable alternative, we should follow the best practices when using them.

### Avoid huge snapshots

Huge snapshots are hard to read and difficult to review. Moreover, when everything is important then nothing is important. Huge snapshots prevent us from focusing on the important parts of the snapshots.

### Avoid repetitive snapshots

If you find yourself creating multiple snapshots of similar contents in the same test, then it's probably a sign that you want to make more atomic assertions instead. Rethink what you want to test, if the first snapshot is only just a reference for the second one, then what you want is likely the **difference** between the snapshots. Store the first result in a variable and assert the difference between the results instead.

## Further readings

- [Effective Snapshot Testing - Kent C. Dodds](https://kentcdodds.com/blog/effective-snapshot-testing)
- [Common Testing Mistakes - Kent C. Dodds](https://kentcdodds.com/blog/common-testing-mistakes)
