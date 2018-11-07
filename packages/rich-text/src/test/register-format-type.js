/**
 * External dependencies
 */
import { noop } from 'lodash';

/**
 *  Internal dependencies
 */
import { registerFormatType } from '../register-format-type';
import { unregisterFormatType } from '../unregister-format-type';
import { getFormatType } from '../get-format-type';
import { getFormatTypes } from '../get-format-types';

describe( 'registerFormatType', () => {
	const defaultFormatSettings = { edit: noop, title: 'format title' };

	// Initialize format store.
	require( '../store' );

	afterEach( () => {
		getFormatTypes().forEach( ( format ) => {
			unregisterFormatType( format.name );
		} );
	} );

	it( 'should reject numbers', () => {
		const format = registerFormatType( 42 );
		expect( console ).toHaveErroredWith( 'Format names must be strings.' );
		expect( format ).toBeUndefined();
	} );

	it( 'should reject format types without a namespace', () => {
		const format = registerFormatType( 'doing-it-wrong' );
		expect( console ).toHaveErroredWith( 'Format names must contain a namespace prefix, include only lowercase alphanumeric characters or dashes, and start with a letter. Example: my-plugin/my-custom-format' );
		expect( format ).toBeUndefined();
	} );

	it( 'should reject format types with too many namespaces', () => {
		const format = registerFormatType( 'doing/it/wrong' );
		expect( console ).toHaveErroredWith( 'Format names must contain a namespace prefix, include only lowercase alphanumeric characters or dashes, and start with a letter. Example: my-plugin/my-custom-format' );
		expect( format ).toBeUndefined();
	} );

	it( 'should reject format types with invalid characters', () => {
		const format = registerFormatType( 'still/_doing_it_wrong' );
		expect( console ).toHaveErroredWith( 'Format names must contain a namespace prefix, include only lowercase alphanumeric characters or dashes, and start with a letter. Example: my-plugin/my-custom-format' );
		expect( format ).toBeUndefined();
	} );

	it( 'should reject format types with uppercase characters', () => {
		const format = registerFormatType( 'Core/Bold' );
		expect( console ).toHaveErroredWith( 'Format names must contain a namespace prefix, include only lowercase alphanumeric characters or dashes, and start with a letter. Example: my-plugin/my-custom-format' );
		expect( format ).toBeUndefined();
	} );

	it( 'should reject format types not starting with a letter', () => {
		const format = registerFormatType( 'my-plugin/4-fancy-format' );
		expect( console ).toHaveErroredWith( 'Format names must contain a namespace prefix, include only lowercase alphanumeric characters or dashes, and start with a letter. Example: my-plugin/my-custom-format' );
		expect( format ).toBeUndefined();
	} );

	it( 'should accept valid format names', () => {
		const format = registerFormatType( 'my-plugin/fancy-format-4', defaultFormatSettings );
		expect( console ).not.toHaveErrored();
		expect( format ).toEqual( {
			name: 'my-plugin/fancy-format-4',
			edit: noop,
			title: 'format title',
		} );
	} );

	it( 'should prohibit registering the same format twice', () => {
		registerFormatType( 'core/test-format', defaultFormatSettings );
		const format = registerFormatType( 'core/test-format', defaultFormatSettings );
		expect( console ).toHaveErroredWith( 'Format "core/test-format" is already registered.' );
		expect( format ).toBeUndefined();
	} );

	it( 'should reject formats without an edit function', () => {
		const format = registerFormatType( 'my-plugin/fancy-format-5' );
		expect( console ).toHaveErroredWith( 'The "edit" property must be specified and must be a valid function.' );
		expect( format ).toBeUndefined();
	} );

	it( 'should reject formats with an invalid edit function', () => {
		const formatType = { edit: 'not-a-function', title: 'format title' },
			format = registerFormatType( 'my-plugin/fancy-format-6', formatType );
		expect( console ).toHaveErroredWith( 'The "edit" property must be specified and must be a valid function.' );
		expect( format ).toBeUndefined();
	} );

	it( 'should reject formats without title', () => {
		const formatType = { edit: noop },
			format = registerFormatType( 'my-plugin/fancy-format-7', formatType );
		expect( console ).toHaveErroredWith( 'The format "my-plugin/fancy-format-7" must have a title.' );
		expect( format ).toBeUndefined();
	} );

	it( 'should reject formats with empty titles', () => {
		const formatType = { edit: noop, title: '' },
			format = registerFormatType( 'my-plugin/fancy-format-8', formatType );
		expect( console ).toHaveErroredWith( 'The format "my-plugin/fancy-format-8" must have a title.' );
		expect( format ).toBeUndefined();
	} );

	it( 'should reject titles which are not strings', () => {
		const formatType = { edit: noop, title: 1337 },
			format = registerFormatType( 'my-plugin/fancy-format-9', formatType );
		expect( console ).toHaveErroredWith( 'Format titles must be strings.' );
		expect( format ).toBeUndefined();
	} );

	it( 'should store a copy of the format type', () => {
		const formatType = { edit: noop, title: 'format title' };
		registerFormatType( 'core/test-format-with-settings', formatType );
		formatType.mutated = true;
		expect( getFormatType( 'core/test-format-with-settings' ) ).toEqual( {
			name: 'core/test-format-with-settings',
			edit: noop,
			title: 'format title',
		} );
	} );
} );
