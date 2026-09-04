import { describe, expect, it } from 'vitest';
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

	it( 'reports a mixed content edit as one Replace: line', () => {
		// The removed and inserted halves of one edit are one change. Two
		// lines read as an unrelated delete plus add (F-27).
		const lines = summarizeOperations( [
			{
				type: 'attribute-set',
				attribute: 'content',
				before: 'The quick fox jumps',
				after: 'The slow fox leaps',
			},
		] );
		expect( lines ).toHaveLength( 1 );
		expect( lines[ 0 ].label ).toBe( 'Replace:' );
		expect( lines[ 0 ].value ).toMatch( /quick.*→.*slow/ );
	} );

	it( 'describes a block merge as a replacement rather than a re-add', () => {
		// Backspace at the start of a paragraph merges it into the heading
		// above, which the whole-content diff sees as the word "heading"
		// growing. Reported as two lines it read as "Delete: heading" plus
		// "Add: headingSphinx of black quartz…" — an append described as a
		// rewrite (F-27, flow ID-10).
		const lines = summarizeOperations( [
			{
				type: 'attribute-set',
				attribute: 'content',
				before: 'heading',
				after: 'headingSphinx of black quartz',
			},
		] );
		expect( lines ).toHaveLength( 1 );
		expect( lines[ 0 ] ).toEqual( {
			label: 'Replace:',
			value: '“heading” → “headingSphinx of black quartz”',
		} );
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

	it( 'reports bold toggled on as "Add formatting: bold"', () => {
		const lines = summarizeOperations( [
			{
				type: 'attribute-set',
				attribute: 'content',
				before: 's magna elementum platea neque.',
				after: 's magna elementum platea <strong>neque</strong>.',
			},
		] );
		expect( lines ).toEqual( [
			{ label: 'Add formatting:', value: 'bold' },
		] );
	} );

	it( 'reports bold toggled off as "Remove formatting: bold"', () => {
		// Adding and removing a format are opposite proposals and both used
		// to read "Formatting: bold", so the sidebar could not tell a
		// reviewer which one was on offer (F-11).
		const lines = summarizeOperations( [
			{
				type: 'attribute-set',
				attribute: 'content',
				before: 'Hello <strong>brave</strong> world',
				after: 'Hello brave world',
			},
		] );
		expect( lines ).toEqual( [
			{ label: 'Remove formatting:', value: 'bold' },
		] );
	} );

	it( 'separates the formats an edit adds from the ones it removes', () => {
		// Swapping italic for bold on the same run is one edit with two
		// directions; both belong in the summary, told apart.
		const lines = summarizeOperations( [
			{
				type: 'attribute-set',
				attribute: 'content',
				before: 'Hello <em>brave</em> world',
				after: 'Hello <strong>brave</strong> world',
			},
		] );
		expect( lines ).toEqual( [
			{ label: 'Add formatting:', value: 'bold' },
			{ label: 'Remove formatting:', value: 'italic' },
		] );
	} );

	it( 'does not report a direction for a tag rewritten to a synonym', () => {
		// `<b>` and `<strong>` are both "bold", so this is not bold being
		// added and removed at once — it is no format change at all.
		const lines = summarizeOperations( [
			{
				type: 'attribute-set',
				attribute: 'content',
				before: 'Hello <b>brave</b> world',
				after: 'Hello <strong>brave</strong> world',
			},
		] );
		expect( lines ).toEqual( [ { label: 'Change:', value: 'text' } ] );
	} );

	it( 'collapses formats changed in the same direction into one line', () => {
		const lines = summarizeOperations( [
			{
				type: 'attribute-set',
				attribute: 'content',
				before: 'hello world',
				after: '<strong><em>hello</em></strong> world',
			},
		] );
		expect( lines ).toHaveLength( 1 );
		expect( lines[ 0 ].label ).toBe( 'Add formatting:' );
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
		// Both halves of the edit are one change, so they share a `Replace:`
		// line - the point here is that neither half is glued together.
		expect( lines ).toEqual( [
			{
				label: 'Replace:',
				value: '“beta gamma delta epsilon” → “one two three four”',
			},
		] );
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
		expect( lines ).toEqual( [
			{ label: 'Add formatting:', value: 'bold' },
		] );
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

	it( 'summarizes an inline-suggestion format op with its direction', () => {
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
		expect( lines ).toEqual( [
			{ label: 'Add formatting:', value: 'bold' },
		] );
	} );

	it( 'summarizes an inline-suggestion un-format op as a removal', () => {
		// The same operation shape with the markup on the other side is the
		// opposite proposal, and has to read as one (F-11).
		const lines = summarizeOperations( [
			{
				type: 'inline-suggestion',
				attribute: 'content',
				suggestionType: 'format',
				beforeHTML: '<strong>world</strong>',
				afterHTML: 'world',
			},
		] );
		expect( lines ).toEqual( [
			{ label: 'Remove formatting:', value: 'bold' },
		] );
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

	it( 'still surfaces a whitespace-only inline-suggestion add', () => {
		// Regression: typing only whitespace in Suggest mode resolves to a
		// marker whose text is all spaces. The summary used to require
		// `text.trim()` to be truthy and then collapse whitespace, so the line
		// fell back to the generic attribute line instead of reporting the
		// added spaces. It is now described rather than quoted — see the
		// whitespace-by-count test below.
		const lines = summarizeOperations( [
			{
				type: 'inline-suggestion',
				attribute: 'content',
				suggestionType: 'add',
				text: '   ',
			},
		] );
		expect( lines[ 0 ].label ).toBe( 'Add:' );
		expect( lines[ 0 ].value ).not.toBe( '' );
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
		// "Format: heading level" and "Formatting: bold" described two
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
			'Add formatting:',
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

	it( 'describes a whitespace-only addition by kind and count', () => {
		// HTML collapses a quoted run of spaces, so one typed space and three
		// rendered as the identical `Add: " "` (F-27, flow IA-09).
		expect(
			summarizeOperations( [
				{
					type: 'inline-suggestion',
					attribute: 'content',
					suggestionType: 'add',
					text: '   ',
				},
			] )
		).toEqual( [ { label: 'Add:', value: '3 spaces' } ] );
		expect(
			summarizeOperations( [
				{
					type: 'inline-suggestion',
					attribute: 'content',
					suggestionType: 'add',
					text: ' ',
				},
			] )
		).toEqual( [ { label: 'Add:', value: '1 space' } ] );
	} );

	it( 'describes a whitespace-only deletion by kind and count', () => {
		expect(
			summarizeOperations( [
				{
					type: 'inline-suggestion',
					attribute: 'content',
					suggestionType: 'del',
					text: '\n\n',
				},
			] )
		).toEqual( [ { label: 'Delete:', value: '2 line breaks' } ] );
		expect(
			summarizeOperations( [
				{
					type: 'inline-suggestion',
					attribute: 'content',
					suggestionType: 'del',
					text: '\t',
				},
			] )
		).toEqual( [ { label: 'Delete:', value: '1 tab' } ] );
	} );

	it( 'still quotes text that merely contains whitespace', () => {
		expect(
			summarizeOperations( [
				{
					type: 'inline-suggestion',
					attribute: 'content',
					suggestionType: 'add',
					text: ' two words ',
				},
			] )
		).toEqual( [ { label: 'Add:', value: '“ two words ”' } ] );
	} );

	it( 'reports the URL a proposed link points at', () => {
		// "Formatting: link" alone says a link changed but not which one —
		// the URL is the whole substance of a link suggestion (F-27, FS-03).
		const lines = summarizeOperations( [
			{
				type: 'inline-suggestion',
				attribute: 'content',
				suggestionType: 'format',
				beforeHTML: 'example',
				afterHTML: '<a href="https://example.com/docs">example</a>',
			},
		] );
		expect( lines ).toEqual( [
			{ label: 'Add formatting:', value: 'link' },
			{ label: 'Link:', value: 'https://example.com/docs' },
		] );
	} );

	it( 'decodes entities in a link URL and reports a removed link too', () => {
		const lines = summarizeOperations( [
			{
				type: 'attribute-set',
				attribute: 'content',
				before: '<a href="https://example.com/?a=1&amp;b=2">x</a>',
				after: 'x',
			},
		] );
		expect( lines ).toEqual( [
			{ label: 'Remove formatting:', value: 'link' },
			{ label: 'Link:', value: 'https://example.com/?a=1&b=2' },
		] );
	} );

	it( 'names the containing block on an insertion inside a container', () => {
		// A paragraph inserted inside a Group was summarized identically to
		// one inserted at the top level (F-27, flow ST-14).
		expect(
			summarizeOperations( [
				{
					type: 'block-insert-after',
					clientId: 'abc',
					blockName: 'core/paragraph',
					anchorClientId: null,
					parentClientId: 'group-1',
					parentBlockName: 'core/group',
				},
			] )
		).toEqual( [
			{ label: 'Insert block:', value: 'paragraph in group' },
		] );
	} );

	it( 'names the containing block on a removal inside a container', () => {
		expect(
			summarizeOperations( [
				{
					type: 'block-remove',
					clientId: 'abc',
					blockName: 'core/paragraph',
					parentBlockName: 'core/columns',
				},
			] )
		).toEqual( [
			{ label: 'Remove block:', value: 'paragraph in columns' },
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
