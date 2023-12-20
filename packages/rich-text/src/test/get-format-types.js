/**
 * Internal dependencies
 */
import { getFormatTypes } from '../get-format-types';
import { unregisterFormatType } from '../unregister-format-type';
import { registerFormatType } from '../register-format-type';

const noop = () => {};

describe( 'getFormatTypes', () => {
	beforeAll( () => {
		// Initialize the rich-text store.
		require( '../store' );
	} );

	afterEach( () => {
		getFormatTypes().forEach( ( format ) => {
			unregisterFormatType( format.name );
		} );
	} );

	it( 'should return an empty array at first', () => {
		expect( getFormatTypes() ).toEqual( [] );
	} );

	it( 'should return all registered formats', () => {
		const testFormat = {
			edit: noop,
			title: 'format title',
			tagName: 'test',
			className: null,
		};
		const testFormatWithSettings = {
			edit: noop,
			title: 'format title 2',
			keywords: [ 'one', 'two', 'three' ],
			tagName: 'test 2',
			className: null,
			formatTestSetting: 'settingTestValue',
		};
		registerFormatType( 'core/test-format', testFormat );
		registerFormatType(
			'core/test-format-with-settings',
			testFormatWithSettings
		);
		expect( getFormatTypes() ).toEqual( [
			{
				name: 'core/test-format',
				...testFormat,
			},
			{
				name: 'core/test-format-with-settings',
				...testFormatWithSettings,
			},
		] );
	} );
} );
