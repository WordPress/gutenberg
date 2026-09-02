import { afterEach, describe, expect, it } from 'vitest';
import '../store';
import { getFormatType } from '../get-format-type';
import { unregisterFormatType } from '../unregister-format-type';
import { registerFormatType } from '../register-format-type';
import { getFormatTypes } from '../get-format-types';

const noop = () => {};

describe( 'getFormatType', () => {
	afterEach( () => {
		getFormatTypes().forEach( ( format ) => {
			unregisterFormatType( format.name );
		} );
	} );

	it( 'should return all format type elements', () => {
		const formatType = {
			edit: noop,
			title: 'format title',
			keywords: [ 'one', 'two', 'three' ],
			formatTestSetting: 'settingTestValue',
			tagName: 'test',
			className: null,
		};

		registerFormatType( 'core/test-format-with-settings', formatType );

		expect( getFormatType( 'core/test-format-with-settings' ) ).toEqual( {
			name: 'core/test-format-with-settings',
			...formatType,
		} );
	} );
} );
