/**
 * Internal dependencies
 */
import { collectBlockText } from '../suggestion-diff';

describe( 'collectBlockText', () => {
	it( 'returns an empty string for null input', () => {
		expect( collectBlockText( null ) ).toBe( '' );
		expect( collectBlockText( undefined ) ).toBe( '' );
	} );

	it( 'returns the content of a single-block snapshot', () => {
		expect(
			collectBlockText( {
				name: 'core/paragraph',
				attributes: { content: 'Hello world' },
				innerBlocks: [],
			} )
		).toBe( 'Hello world' );
	} );

	it( 'walks innerBlocks recursively', () => {
		expect(
			collectBlockText( {
				name: 'core/group',
				attributes: {},
				innerBlocks: [
					{
						name: 'core/paragraph',
						attributes: { content: 'one' },
						innerBlocks: [],
					},
					{
						name: 'core/paragraph',
						attributes: { content: 'two' },
						innerBlocks: [],
					},
				],
			} )
		).toBe( 'one two' );
	} );

	it( 'stringifies wrapper-shaped content via toString', () => {
		const wrapped = {
			toString() {
				return 'wrapped text';
			},
		};
		expect(
			collectBlockText( {
				name: 'core/paragraph',
				attributes: { content: wrapped },
				innerBlocks: [],
			} )
		).toBe( 'wrapped text' );
	} );
} );
