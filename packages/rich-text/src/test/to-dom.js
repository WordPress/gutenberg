/**
 * Internal dependencies
 */

import { toDom } from '../to-dom';
import { spec } from './helpers';

describe( 'recordToDom', () => {
	beforeAll( () => {
		// Initialize the rich-text store.
		require( '../store' );
	} );

	spec.forEach(
		( { description, multilineTag, record, startPath, endPath } ) => {
			// eslint-disable-next-line jest/valid-title
			it( description, () => {
				const { body, selection } = toDom( {
					value: record,
					multilineTag,
				} );
				expect( body ).toMatchSnapshot();
				expect( selection ).toEqual( { startPath, endPath } );
			} );
		}
	);
} );
