/**
 * External dependencies
 */
import { noop } from 'lodash';

/**
 * Internal dependencies
 */
import { getFormatTypes } from '../get-format-types';
import { unregisterFormatType } from '../unregister-format-type';
import { registerFormatType } from '../register-format-type';

describe( 'getFormatTypes', () => {
	// Initialize format store.
	require( '../store' );

	afterEach( () => {
		getFormatTypes().forEach( ( format ) => {
			unregisterFormatType( format.name );
		} );
	} );

	it( 'should return an empty array at first', () => {
		expect( getFormatTypes() ).toEqual( [] );
	} );

	it( 'should return all registered formats', () => {
		const formatType1 = { edit: noop, title: 'format title' };
		const formatType2 = {
			edit: noop,
			title: 'format title 2',
			keywords: [ 'one', 'two', 'three' ],
			formatTestSetting: 'settingTestValue',
		};
		registerFormatType( 'core/test-format', formatType1 );
		registerFormatType( 'core/test-format-with-settings', formatType2 );
		expect( getFormatTypes() ).toEqual( [
			{
				name: 'core/test-format',
				...formatType1,
			},
			{
				name: 'core/test-format-with-settings',
				...formatType2,
			},
		] );
	} );
} );
