import browserslist from 'browserslist';
import wordpressBrowserslistConfig from '@wordpress/browserslist-config';
import { getBrowserslistQueries } from '../browserslist.mjs';

describe( 'browserslist targeting', () => {
	afterEach( () => {
		jest.restoreAllMocks();
	} );

	it( 'falls back to @wordpress/browserslist-config when the project has no config', () => {
		jest.spyOn( browserslist, 'findConfig' ).mockReturnValue( undefined );

		expect( getBrowserslistQueries() ).toEqual(
			wordpressBrowserslistConfig
		);
	} );

	it( 'uses the project browserslist config when one is present', () => {
		jest.spyOn( browserslist, 'findConfig' ).mockReturnValue( {
			defaults: [ 'last 1 chrome version' ],
		} );

		expect( getBrowserslistQueries() ).toEqual( [
			'last 1 chrome version',
		] );
	} );
} );
