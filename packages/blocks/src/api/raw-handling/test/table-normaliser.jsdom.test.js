import { describe, expect, it } from 'vitest';
import tableNormaliser from '../table-normaliser';
import { deepFilterHTML } from '../utils';

describe( 'tableNormaliser', () => {
	it( 'unwraps a single-cell table into its cell content', () => {
		const input = '<table><tr><td>Hello there</td></tr></table>';

		expect( deepFilterHTML( input, [ tableNormaliser ] ) ).toEqual(
			'<p>Hello there</p>'
		);
	} );

	it( 'unwraps a single-column table, joining each row in order', () => {
		const input =
			'<table>' +
			'<tr><td>First</td></tr>' +
			'<tr><td>Second</td></tr>' +
			'</table>';

		expect( deepFilterHTML( input, [ tableNormaliser ] ) ).toEqual(
			'<p>First</p><p>Second</p>'
		);
	} );

	it( 'leaves a table with a multi-cell row untouched', () => {
		const input = '<table><tr><td>A</td><td>B</td></tr></table>';

		// The browser wraps bare <tr> elements in a <tbody> when parsing,
		// independently of the normaliser.
		expect( deepFilterHTML( input, [ tableNormaliser ] ) ).toEqual(
			'<table><tbody><tr><td>A</td><td>B</td></tr></tbody></table>'
		);
	} );

	it( 'leaves untouched a single-column table where only one row has more than one cell', () => {
		const input =
			'<table>' +
			'<tr><td>Header spanning</td></tr>' +
			'<tr><td>A</td><td>B</td></tr>' +
			'</table>';

		expect( deepFilterHTML( input, [ tableNormaliser ] ) ).toEqual(
			'<table><tbody><tr><td>Header spanning</td></tr><tr><td>A</td><td>B</td></tr></tbody></table>'
		);
	} );

	it( 'leaves an empty table untouched', () => {
		const input = '<table></table>';

		expect( deepFilterHTML( input, [ tableNormaliser ] ) ).toEqual( input );
	} );

	it( 'unwraps nested single-cell layout tables while preserving a real inner data table', () => {
		const input =
			'<table><tr><td>' +
			'<table><tr><td>' +
			'<table><tr><td>A</td><td>B</td></tr><tr><td>C</td><td>D</td></tr></table>' +
			'</td></tr></table>' +
			'</td></tr></table>';

		expect( deepFilterHTML( input, [ tableNormaliser ] ) ).toEqual(
			'<table><tbody><tr><td>A</td><td>B</td></tr><tr><td>C</td><td>D</td></tr></tbody></table>'
		);
	} );
} );
