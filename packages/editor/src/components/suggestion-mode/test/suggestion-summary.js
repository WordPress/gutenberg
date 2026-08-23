import { summarizeOperations } from '../suggestion-summary';

describe( 'summarizeOperations', () => {
	it( 'returns an empty list for missing or empty operations', () => {
		expect( summarizeOperations( undefined ) ).toEqual( [] );
		expect( summarizeOperations( [] ) ).toEqual( [] );
	} );

	it( 'quotes a purely-inserted content span as Add:', () => {
		const lines = summarizeOperations( [
			{
				type: 'attribute-set',
				attribute: 'content',
				before: 'Hello world',
				after: 'Hello brave new world',
			},
		] );
		expect( lines ).toEqual( [ { label: 'Add:', value: '“brave new”' } ] );
	} );

	it( 'quotes a purely-removed content span as Delete:', () => {
		const lines = summarizeOperations( [
			{
				type: 'attribute-set',
				attribute: 'content',
				before: 'Hello brave new world',
				after: 'Hello world',
			},
		] );
		expect( lines ).toEqual( [
			{ label: 'Delete:', value: '“brave new”' },
		] );
	} );

	it( 'reports both Add: and Delete: lines for a mixed content edit', () => {
		const lines = summarizeOperations( [
			{
				type: 'attribute-set',
				attribute: 'content',
				before: 'The quick fox jumps',
				after: 'The slow fox leaps',
			},
		] );
		expect( lines ).toEqual(
			expect.arrayContaining( [
				{ label: 'Add:', value: expect.stringContaining( 'slow' ) },
				{ label: 'Delete:', value: expect.stringContaining( 'quick' ) },
			] )
		);
	} );

	it( 'collapses non-content attribute changes into a Change: line', () => {
		const lines = summarizeOperations( [
			{
				type: 'attribute-set',
				attribute: 'level',
				before: 2,
				after: 3,
			},
			{
				type: 'attribute-set',
				attribute: 'align',
				before: null,
				after: 'center',
			},
		] );
		expect( lines ).toEqual( [
			{
				label: 'Change:',
				value: expect.stringMatching( /heading level.*alignment/i ),
			},
		] );
	} );

	it( 'combines content and format changes in a single summary', () => {
		const lines = summarizeOperations( [
			{
				type: 'attribute-set',
				attribute: 'content',
				before: 'Hi',
				after: 'Hi there',
			},
			{
				type: 'attribute-set',
				attribute: 'level',
				before: 2,
				after: 3,
			},
		] );
		expect( lines ).toEqual(
			expect.arrayContaining( [
				{ label: 'Add:', value: expect.stringContaining( 'there' ) },
				{
					label: 'Change:',
					value: expect.stringContaining( 'heading level' ),
				},
			] )
		);
	} );

	it( 'ellipsizes very long insertions and deletions', () => {
		const long = 'lorem ipsum '.repeat( 50 );
		const lines = summarizeOperations( [
			{
				type: 'attribute-set',
				attribute: 'content',
				before: '',
				after: long,
			},
		] );
		expect( lines ).toHaveLength( 1 );
		expect( lines[ 0 ].label ).toBe( 'Add:' );
		expect( lines[ 0 ].value.endsWith( '…”' ) ).toBe( true );
	} );

	it( 'reports bold toggled on as Formatting: bold', () => {
		const lines = summarizeOperations( [
			{
				type: 'attribute-set',
				attribute: 'content',
				before: 's magna elementum platea neque.',
				after: 's magna elementum platea <strong>neque</strong>.',
			},
		] );
		expect( lines ).toEqual( [ { label: 'Formatting:', value: 'bold' } ] );
	} );

	it( 'reports bold toggled off as Formatting: bold', () => {
		const lines = summarizeOperations( [
			{
				type: 'attribute-set',
				attribute: 'content',
				before: 'Hello <strong>brave</strong> world',
				after: 'Hello brave world',
			},
		] );
		expect( lines ).toEqual( [ { label: 'Formatting:', value: 'bold' } ] );
	} );

	it( 'collapses multiple inline format changes into one Formatting: line', () => {
		const lines = summarizeOperations( [
			{
				type: 'attribute-set',
				attribute: 'content',
				before: 'hello world',
				after: '<strong><em>hello</em></strong> world',
			},
		] );
		expect( lines ).toHaveLength( 1 );
		expect( lines[ 0 ].label ).toBe( 'Formatting:' );
		expect( lines[ 0 ].value ).toMatch( /bold/ );
		expect( lines[ 0 ].value ).toMatch( /italic/ );
	} );

	it( 'still reports Add/Delete when text also changed alongside formatting', () => {
		const lines = summarizeOperations( [
			{
				type: 'attribute-set',
				attribute: 'content',
				before: 'Hello world',
				after: 'Hello <strong>brave</strong> world',
			},
		] );
		// Visible text differs ("brave" inserted), so this takes the text-diff
		// path rather than the Formatting: path.
		expect( lines ).toEqual(
			expect.arrayContaining( [
				{ label: 'Add:', value: expect.stringContaining( 'brave' ) },
			] )
		);
	} );

	it( 'keeps the spaces between consecutive changed words', () => {
		// The word diff tokenizes whitespace separately, so a space between
		// two changed words can match a space on the other side and land in
		// the diff as an `equal` segment. Concatenating only the changed
		// segments then glued the words together: a cross-block delete quoted
		// "blackquartzjudgemyvow," in the sidebar (F-10).
		const lines = summarizeOperations( [
			{
				type: 'attribute-set',
				attribute: 'content',
				before: 'alpha beta gamma delta epsilon',
				after: 'alpha one two three four',
			},
		] );
		expect( lines ).toEqual(
			expect.arrayContaining( [
				{ label: 'Add:', value: '“one two three four”' },
				{ label: 'Delete:', value: '“beta gamma delta epsilon”' },
			] )
		);
	} );

	it( 'does not leak markup into a quoted Add: line', () => {
		// Diffing the raw content attribute treats a tag as a token, so
		// `<strong>` and `</strong>` were quoted to the reviewer as literal
		// text alongside the words they wrap (F-10).
		const lines = summarizeOperations( [
			{
				type: 'attribute-set',
				attribute: 'content',
				before: 'A short paragraph here.',
				after: 'A short paragraph containing <strong>bold text</strong> here.',
			},
		] );
		expect( lines ).toEqual( [
			{ label: 'Add:', value: '“containing bold text”' },
		] );
		expect( lines[ 0 ].value ).not.toMatch( /</ );
	} );

	it( 'separates changed runs that were not adjacent in the text', () => {
		// Two insertions three words apart are two proposals, not one phrase.
		const lines = summarizeOperations( [
			{
				type: 'attribute-set',
				attribute: 'content',
				before: 'Hello world, this is a sentence.',
				after: 'Hello brave new world, this is a much longer sentence.',
			},
		] );
		expect( lines ).toEqual( [
			{ label: 'Add:', value: '“brave new … much longer”' },
		] );
	} );

	it( 'treats a line break as a word separator when quoting', () => {
		// `textContent` drops a `<br>` without leaving a separator behind, so
		// the words on either side of a soft line break ran together.
		const lines = summarizeOperations( [
			{
				type: 'attribute-set',
				attribute: 'content',
				before: 'First line',
				after: 'First line<br>second line',
			},
		] );
		expect( lines ).toEqual( [
			{ label: 'Add:', value: '“second line”' },
		] );
	} );

	it( 'treats non-text content attributes as a format change', () => {
		const lines = summarizeOperations( [
			{
				type: 'attribute-set',
				attribute: 'content',
				before: { not: 'a string' },
				after: { also: 'object' },
			},
		] );
		expect( lines ).toEqual( [ { label: 'Change:', value: 'text' } ] );
	} );

	it( 'decodes HTML entities when comparing visible text', () => {
		// `&amp;` and `&` render to the same visible text. The summary
		// should treat this as a pure formatting change (bold toggled),
		// not as an Add/Delete of an ampersand.
		const lines = summarizeOperations( [
			{
				type: 'attribute-set',
				attribute: 'content',
				before: 'Tom &amp; Jerry',
				after: '<strong>Tom &amp; Jerry</strong>',
			},
		] );
		expect( lines ).toEqual( [ { label: 'Formatting:', value: 'bold' } ] );
	} );

	it( 'summarizes an inline-suggestion add op as "Add: <text>"', () => {
		// An inline addition carries no before/after in the payload — the
		// proposed words live in the in-content marker and are resolved into
		// `text` by the sidebar before summarizing.
		const lines = summarizeOperations( [
			{
				type: 'inline-suggestion',
				attribute: 'content',
				suggestionType: 'add',
				text: 'new text',
			},
		] );
		expect( lines ).toEqual( [ { label: 'Add:', value: '“new text”' } ] );
	} );

	it( 'summarizes an inline-suggestion del op as "Delete: <text>"', () => {
		const lines = summarizeOperations( [
			{
				type: 'inline-suggestion',
				attribute: 'content',
				suggestionType: 'del',
				text: 'old text',
			},
		] );
		expect( lines ).toEqual( [
			{ label: 'Delete:', value: '“old text”' },
		] );
	} );

	it( 'summarizes an inline-suggestion format op as "Formatting: <format>"', () => {
		// A format suggestion changes only markup, so it surfaces which
		// formats changed (from the captured before/after run HTML) rather
		// than quoting the unchanged text.
		const lines = summarizeOperations( [
			{
				type: 'inline-suggestion',
				attribute: 'content',
				suggestionType: 'format',
				beforeHTML: 'world',
				afterHTML: '<strong>world</strong>',
			},
		] );
		expect( lines ).toEqual( [ { label: 'Formatting:', value: 'bold' } ] );
	} );

	it( 'falls back to the attribute label for a format op with no HTML delta', () => {
		// No detectable markup change (e.g. the captured HTML is missing):
		// degrade to the generic attribute label rather than an empty line.
		const lines = summarizeOperations( [
			{
				type: 'inline-suggestion',
				attribute: 'content',
				suggestionType: 'format',
			},
		] );
		expect( lines ).toEqual( [ { label: 'Change:', value: 'text' } ] );
	} );

	it( 'quotes a whitespace-only inline-suggestion add verbatim', () => {
		// Regression: typing only whitespace in Suggest mode resolves to a
		// marker whose text is all spaces. The summary used to require
		// `text.trim()` to be truthy and then collapse whitespace, so the line
		// fell back to the generic attribute line instead of showing the
		// added spaces.
		const lines = summarizeOperations( [
			{
				type: 'inline-suggestion',
				attribute: 'content',
				suggestionType: 'add',
				text: '   ',
			},
		] );
		expect( lines ).toEqual( [ { label: 'Add:', value: '“   ”' } ] );
	} );

	it( 'falls back to a format line for an inline-suggestion with no resolved text', () => {
		// The marker can no longer be found in content (e.g. the block was
		// edited away): degrade to the generic attribute label rather than an
		// empty "Add:" quote.
		const lines = summarizeOperations( [
			{
				type: 'inline-suggestion',
				attribute: 'content',
				suggestionType: 'add',
			},
		] );
		expect( lines ).toEqual( [ { label: 'Change:', value: 'text' } ] );
	} );

	it( 'keeps attribute changes and inline formatting a word apart', () => {
		// "Format: heading level" and "Formatting: bold" describe two
		// different families of suggestion and used to read as near-identical
		// labels in a mixed list (F-16).
		const lines = summarizeOperations( [
			{
				type: 'attribute-set',
				attribute: 'content',
				before: 'Hello world',
				after: '<strong>Hello world</strong>',
			},
			{
				type: 'attribute-set',
				attribute: 'level',
				before: 2,
				after: 3,
			},
		] );
		expect( lines.map( ( line ) => line.label ) ).toEqual( [
			'Formatting:',
			'Change:',
		] );
		expect( lines ).not.toContainEqual(
			expect.objectContaining( { label: 'Format:' } )
		);
	} );

	it( 'names the additional CSS class setting rather than "classname"', () => {
		const lines = summarizeOperations( [
			{
				type: 'attribute-set',
				attribute: 'className',
				before: null,
				after: 'is-highlighted',
			},
		] );
		expect( lines ).toEqual( [
			{ label: 'Change:', value: 'additional CSS class' },
		] );
	} );

	it( 'humanizes an attribute it has no friendly label for', () => {
		// The raw key used to be lowercased whole, so `fontFamily` reached the
		// sidebar as the non-word "fontfamily".
		const lines = summarizeOperations( [
			{
				type: 'attribute-set',
				attribute: 'fontFamily',
				before: null,
				after: 'serif',
			},
		] );
		expect( lines ).toEqual( [
			{ label: 'Change:', value: 'font family' },
		] );
	} );

	it( 'reports a block rename with the name being proposed', () => {
		// A rename is a `metadata` write, which the generic path reported as
		// the bare word "metadata" — true but useless to a reviewer (F-16).
		const lines = summarizeOperations( [
			{
				type: 'attribute-set',
				attribute: 'metadata',
				before: {},
				after: { name: 'Intro paragraph' },
			},
		] );
		expect( lines ).toEqual( [
			{ label: 'Rename block:', value: '“Intro paragraph”' },
		] );
	} );

	it( 'reports clearing a custom block name as a reset', () => {
		const lines = summarizeOperations( [
			{
				type: 'attribute-set',
				attribute: 'metadata',
				before: { name: 'Intro paragraph' },
				after: {},
			},
		] );
		expect( lines ).toEqual( [
			{
				label: 'Rename block:',
				value: 'reset “Intro paragraph” to the default name',
			},
		] );
	} );

	it( 'falls back to a settings label for a metadata write that is not a rename', () => {
		// Bindings and pattern overrides also live in `metadata`; only a name
		// change should claim the rename line.
		const lines = summarizeOperations( [
			{
				type: 'attribute-set',
				attribute: 'metadata',
				before: { bindings: {} },
				after: { bindings: { content: { source: 'core/post-meta' } } },
			},
		] );
		expect( lines ).toEqual( [
			{ label: 'Change:', value: 'block settings' },
		] );
	} );

	it( 'summarizes a block-remove op as "Remove block: <name>"', () => {
		const lines = summarizeOperations( [
			{
				type: 'block-remove',
				clientId: 'abc',
				blockName: 'core/paragraph',
			},
		] );
		expect( lines ).toEqual( [
			{ label: 'Remove block:', value: 'paragraph' },
		] );
	} );

	it( 'falls back to "block" when the block name is missing', () => {
		const lines = summarizeOperations( [
			{ type: 'block-remove', clientId: 'abc' },
		] );
		expect( lines ).toEqual( [
			{ label: 'Remove block:', value: 'block' },
		] );
	} );

	it( 'preserves a non-namespaced block name', () => {
		const lines = summarizeOperations( [
			{
				type: 'block-remove',
				clientId: 'abc',
				blockName: 'custom-block',
			},
		] );
		expect( lines ).toEqual( [
			{ label: 'Remove block:', value: 'custom-block' },
		] );
	} );

	it( 'summarizes a block-insert-after op as "Insert block: <name>"', () => {
		const lines = summarizeOperations( [
			{
				type: 'block-insert-after',
				clientId: 'abc',
				blockName: 'core/paragraph',
				anchorClientId: null,
				parentClientId: null,
			},
		] );
		expect( lines ).toEqual( [
			{ label: 'Insert block:', value: 'paragraph' },
		] );
	} );

	it( 'summarizes a block-move op as "Move block: <name>"', () => {
		const lines = summarizeOperations( [
			{
				type: 'block-move',
				clientId: 'abc',
				blockName: 'core/paragraph',
				fromAnchorClientId: 'sibling-a',
				toAnchorClientId: 'sibling-b',
			},
		] );
		expect( lines ).toEqual( [
			{ label: 'Move block:', value: 'paragraph' },
		] );
	} );
} );
