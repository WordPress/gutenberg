/**
 * Internal dependencies
 */
import Platform from '../platform';

describe( 'Platform', () => {
	it( 'selects the web value', () => {
		const element = Platform.select( {
			web: <div />,
			default: <button />,
		} );

		expect( element ).toEqual( <div /> );
	} );

	it( 'falls back to the default value when no web value is provided', () => {
		const element = Platform.select( {
			default: <button />,
		} );

		expect( element ).toEqual( <button /> );
	} );
} );
