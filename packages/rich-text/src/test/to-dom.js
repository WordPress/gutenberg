/**
 * Internal dependencies
 */

import { toElement } from '../to-element';
import { spec } from './helpers';

// Keep name and file intact for now to see diff.
describe( 'recordToDom', () => {
	beforeAll( () => {
		// Initialize the rich-text store.
		require( '../store' );
	} );

	spec.forEach( ( {
		description,
		multilineTag,
		record,
		startPath,
		endPath,
	} ) => {
		it( description, () => {
			const { element, selection } = toElement( {
				value: record,
				multilineTag,
			} );
			expect( element ).toMatchSnapshot();
			expect( selection ).toEqual( { startPath, endPath } );
		} );
	} );
} );
