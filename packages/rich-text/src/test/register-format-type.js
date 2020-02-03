/**
 * WordPress dependencies
 */
import { select } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { registerFormatType } from '../register-format-type';
import { unregisterFormatType } from '../unregister-format-type';
import { getFormatType } from '../get-format-type';

describe( 'registerFormatType', () => {
	beforeAll( () => {
		// Initialize the rich-text store.
		require( '../store' );
	} );

	afterEach( () => {
		select( 'core/rich-text' )
			.getFormatTypes()
			.forEach( ( { name } ) => {
				unregisterFormatType( name );
			} );
	} );

	const validName = 'plugin/test';
	const validSettings = {
		tagName: 'test',
		className: null,
		title: 'Test',
		edit() {},
	};

	it( 'should register format', () => {
		const settings = registerFormatType( validName, validSettings );
		expect( settings ).toEqual( { ...validSettings, name: validName } );
		expect( console ).not.toHaveErrored();
	} );

	it( 'should error without arguments', () => {
		const format = registerFormatType();
		expect( console ).toHaveErroredWith( 'Format names must be strings.' );
		expect( format ).toBeUndefined();
	} );

	it( 'should reject format types without a namespace', () => {
		const format = registerFormatType( 'doing-it-wrong' );
		expect( console ).toHaveErroredWith(
			'Format names must contain a namespace prefix, include only lowercase alphanumeric characters or dashes, and start with a letter. Example: my-plugin/my-custom-format'
		);
		expect( format ).toBeUndefined();
	} );

	it( 'should reject format types with too many namespaces', () => {
		const format = registerFormatType( 'doing/it/wrong' );
		expect( console ).toHaveErroredWith(
			'Format names must contain a namespace prefix, include only lowercase alphanumeric characters or dashes, and start with a letter. Example: my-plugin/my-custom-format'
		);
		expect( format ).toBeUndefined();
	} );

	it( 'should reject format types with invalid characters', () => {
		const format = registerFormatType( 'still/_doing_it_wrong' );
		expect( console ).toHaveErroredWith(
			'Format names must contain a namespace prefix, include only lowercase alphanumeric characters or dashes, and start with a letter. Example: my-plugin/my-custom-format'
		);
		expect( format ).toBeUndefined();
	} );

	it( 'should reject format types with uppercase characters', () => {
		const format = registerFormatType( 'Core/Bold' );
		expect( console ).toHaveErroredWith(
			'Format names must contain a namespace prefix, include only lowercase alphanumeric characters or dashes, and start with a letter. Example: my-plugin/my-custom-format'
		);
		expect( format ).toBeUndefined();
	} );

	it( 'should reject format types not starting with a letter', () => {
		const format = registerFormatType( 'my-plugin/4-fancy-format' );
		expect( console ).toHaveErroredWith(
			'Format names must contain a namespace prefix, include only lowercase alphanumeric characters or dashes, and start with a letter. Example: my-plugin/my-custom-format'
		);
		expect( format ).toBeUndefined();
	} );

	it( 'should reject numbers', () => {
		const format = registerFormatType( 42 );
		expect( console ).toHaveErroredWith( 'Format names must be strings.' );
		expect( format ).toBeUndefined();
	} );

	it( 'should accept valid format names', () => {
		const format = registerFormatType(
			'my-plugin/fancy-format-4',
			validSettings
		);
		expect( console ).not.toHaveErrored();
		expect( format ).toEqual( {
			name: 'my-plugin/fancy-format-4',
			...validSettings,
		} );
	} );

	it( 'should error on already registered name', () => {
		registerFormatType( validName, validSettings );
		const duplicateFormat = registerFormatType( validName, validSettings );
		expect( console ).toHaveErroredWith(
			'Format "plugin/test" is already registered.'
		);
		expect( duplicateFormat ).toBeUndefined();
	} );

	it( 'should reject formats without tag name', () => {
		const settings = { ...validSettings };
		delete settings.tagName;
		const format = registerFormatType( validName, settings );
		expect( console ).toHaveErroredWith(
			'Format tag names must be a string.'
		);
		expect( format ).toBeUndefined();
	} );

	it( 'should error on empty tagName property', () => {
		const format = registerFormatType( validName, {
			...validSettings,
			tagName: '',
		} );
		expect( console ).toHaveErroredWith(
			'Format tag names must be a string.'
		);
		expect( format ).toBeUndefined();
	} );

	it( 'should reject formats without class name', () => {
		const settings = { ...validSettings };
		delete settings.className;
		const format = registerFormatType( validName, settings );
		expect( console ).toHaveErroredWith(
			'Format class names must be a string, or null to handle bare elements.'
		);
		expect( format ).toBeUndefined();
	} );

	it( 'should error on invalid empty className property', () => {
		const format = registerFormatType( validName, {
			...validSettings,
			className: '',
		} );
		expect( console ).toHaveErroredWith(
			'Format class names must be a string, or null to handle bare elements.'
		);
		expect( format ).toBeUndefined();
	} );

	it( 'should error on invalid className property', () => {
		const format = registerFormatType( validName, {
			...validSettings,
			className: 'invalid class name',
		} );
		expect( console ).toHaveErroredWith(
			'A class name must begin with a letter, followed by any number of hyphens, letters, or numbers.'
		);
		expect( format ).toBeUndefined();
	} );

	it( 'should error on already registered tagName', () => {
		registerFormatType( validName, validSettings );
		const duplicateTagNameFormat = registerFormatType(
			'plugin/second',
			validSettings
		);
		expect( console ).toHaveErroredWith(
			'Format "plugin/test" is already registered to handle bare tag name "test".'
		);
		expect( duplicateTagNameFormat ).toBeUndefined();
	} );

	it( 'should error on already registered className', () => {
		registerFormatType( validName, {
			...validSettings,
			className: 'test',
		} );
		const duplicateClassNameFormat = registerFormatType( 'plugin/second', {
			...validSettings,
			className: 'test',
		} );
		expect( console ).toHaveErroredWith(
			'Format "plugin/test" is already registered to handle class name "test".'
		);
		expect( duplicateClassNameFormat ).toBeUndefined();
	} );

	it( 'should reject formats without title', () => {
		const settings = { ...validSettings };
		delete settings.title;
		const format = registerFormatType( validName, settings );
		expect( console ).toHaveErroredWith(
			`The format "${ validName }" must have a title.`
		);
		expect( format ).toBeUndefined();
	} );

	it( 'should error on empty title property', () => {
		const format = registerFormatType( validName, {
			...validSettings,
			title: '',
		} );
		expect( console ).toHaveErroredWith(
			'The format "plugin/test" must have a title.'
		);
		expect( format ).toBeUndefined();
	} );

	it( 'should reject titles which are not strings', () => {
		const format = registerFormatType( validName, {
			...validSettings,
			title: 1337,
		} );
		expect( console ).toHaveErroredWith( 'Format titles must be strings.' );
		expect( format ).toBeUndefined();
	} );

	it( 'should store a copy of the format type', () => {
		const formatType = { ...validSettings };
		registerFormatType( validName, formatType );
		formatType.mutated = true;
		expect( getFormatType( validName ) ).toEqual( {
			name: validName,
			...validSettings,
		} );
	} );
} );
