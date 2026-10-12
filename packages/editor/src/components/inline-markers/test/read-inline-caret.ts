import { describe, expect, it } from 'vitest';
import { readInlineCaret } from '../read-inline-caret';

/**
 * Build the two block-editor selection selectors from a single pair of points.
 *
 * @param start Selection start point.
 * @param end   Selection end point.
 * @return `[getSelectionStart, getSelectionEnd]`.
 */
function selectors( start: any, end: any ) {
	return [ () => start, () => end ];
}

describe( 'readInlineCaret', () => {
	it( 'returns null when there is no clientId', () => {
		const [ s, e ] = selectors( {}, {} );
		expect( readInlineCaret( s, e ) ).toBeNull();
	} );

	it( 'returns null when start and end are in different blocks', () => {
		const [ s, e ] = selectors(
			{ clientId: 'a', attributeKey: 'content', offset: 0 },
			{ clientId: 'b', attributeKey: 'content', offset: 5 }
		);
		expect( readInlineCaret( s, e ) ).toBeNull();
	} );

	it( 'returns null without an attributeKey (block-level selection)', () => {
		const [ s, e ] = selectors(
			{ clientId: 'a', offset: 0 },
			{ clientId: 'a', offset: 5 }
		);
		expect( readInlineCaret( s, e ) ).toBeNull();
	} );

	it( 'returns null when start and end are in different attributes of the same block', () => {
		// Two rich-text fields of one block, such as a quote's `value` and
		// `citation`: their offsets are not comparable.
		const [ s, e ] = selectors(
			{ clientId: 'a', attributeKey: 'value', offset: 2 },
			{ clientId: 'a', attributeKey: 'citation', offset: 1 }
		);
		expect( readInlineCaret( s, e ) ).toBeNull();
	} );

	it( 'accepts a collapsed caret', () => {
		const [ s, e ] = selectors(
			{ clientId: 'a', attributeKey: 'content', offset: 3 },
			{ clientId: 'a', attributeKey: 'content', offset: 3 }
		);
		expect( readInlineCaret( s, e ) ).toEqual( {
			clientId: 'a',
			attributeKey: 'content',
			start: 3,
			end: 3,
		} );
	} );

	it( 'normalizes a reversed (backward) selection', () => {
		const [ s, e ] = selectors(
			{ clientId: 'a', attributeKey: 'content', offset: 8 },
			{ clientId: 'a', attributeKey: 'content', offset: 2 }
		);
		expect( readInlineCaret( s, e ) ).toEqual( {
			clientId: 'a',
			attributeKey: 'content',
			start: 2,
			end: 8,
		} );
	} );
} );
