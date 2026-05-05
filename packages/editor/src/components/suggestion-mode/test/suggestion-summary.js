/**
 * Internal dependencies
 */
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

	it( 'collapses non-content attribute changes into a Format: line', () => {
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
				label: 'Format:',
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
					label: 'Format:',
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

	it( 'treats non-text content attributes as a format change', () => {
		const lines = summarizeOperations( [
			{
				type: 'attribute-set',
				attribute: 'content',
				before: { not: 'a string' },
				after: { also: 'object' },
			},
		] );
		expect( lines ).toEqual( [ { label: 'Format:', value: 'content' } ] );
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
} );
