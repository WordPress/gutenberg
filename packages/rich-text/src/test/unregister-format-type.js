/**
 * External dependencies
 */
import { noop } from 'lodash';

/**
 * Internal dependencies
 */
import { unregisterFormatType } from '../unregister-format-type';
import { registerFormatType } from '../register-format-type';
import { getFormatTypes } from '../get-format-types';
import { getFormatType } from '../get-format-type';

describe( 'unregisterFormatType', () => {
	const defaultFormatSettings = {
		edit: noop,
		title: 'format title',
		tagName: 'test',
		className: null,
	};

	beforeAll( () => {
		// Initialize the rich-text store.
		require( '../store' );
	} );

	afterEach( () => {
		getFormatTypes().forEach( ( format ) => {
			unregisterFormatType( format.name );
		} );
	} );

	it( 'should fail if the format is not registered', () => {
		const oldFormat = unregisterFormatType( 'core/test-format' );
		expect( console ).toHaveErroredWith(
			'Format core/test-format is not registered.'
		);
		expect( oldFormat ).toBeUndefined();
	} );

	it( 'should unregister existing formats', () => {
		registerFormatType( 'core/test-format', defaultFormatSettings );
		expect( getFormatType( 'core/test-format' ) ).toEqual( {
			name: 'core/test-format',
			...defaultFormatSettings,
		} );
		const oldFormat = unregisterFormatType( 'core/test-format' );
		expect( console ).not.toHaveErrored();
		expect( oldFormat ).toEqual( {
			name: 'core/test-format',
			...defaultFormatSettings,
		} );
		expect( getFormatTypes() ).toEqual( [] );
	} );
} );
