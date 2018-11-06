/**
 * WordPress dependencies
 */
import { select } from '@wordpress/data';

/**
 * Internal dependencies
 */

import { registerFormatType } from '../register-format-type';
import { unregisterFormatType } from '../unregister-format-type';

describe( 'registerFormatType', () => {
	beforeAll( () => {
		// Initialize the rich-text store.
		require( '../store' );
	} );

	afterEach( () => {
		select( 'core/rich-text' ).getFormatTypes().forEach( ( { name } ) => {
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
		registerFormatType();
		expect( console ).toHaveErroredWith( 'Format names must be strings.' );
	} );

	it( 'should error on invalid name', () => {
		registerFormatType( 'test', validSettings );
		expect( console ).toHaveErroredWith( 'Format names must contain a namespace prefix, include only lowercase alphanumeric characters or dashes, and start with a letter. Example: my-plugin/my-custom-format' );
	} );

	it( 'should error on already registered name', () => {
		registerFormatType( validName, validSettings );
		registerFormatType( validName, validSettings );
		expect( console ).toHaveErroredWith( 'Format "plugin/test" is already registered.' );
	} );

	it( 'should error on undefined edit property', () => {
		registerFormatType( 'plugin/test', {
			...validSettings,
			edit: undefined,
		} );
		expect( console ).toHaveErroredWith( 'The "edit" property must be specified and must be a valid function.' );
	} );

	it( 'should error on empty tagName property', () => {
		registerFormatType( validName, {
			...validSettings,
			tagName: '',
		} );
		expect( console ).toHaveErroredWith( 'Format tag names must be a string.' );
	} );

	it( 'should error on invalid empty className property', () => {
		registerFormatType( validName, {
			...validSettings,
			className: '',
		} );
		expect( console ).toHaveErroredWith( 'Format class names must be a string, or null to handle bare elements.' );
	} );

	it( 'should error on invalid className property', () => {
		registerFormatType( validName, {
			...validSettings,
			className: 'invalid class name',
		} );
		expect( console ).toHaveErroredWith( 'A class name must begin with a letter, followed by any number of hyphens, letters, or numbers.' );
	} );

	it( 'should error on already registered tagName', () => {
		registerFormatType( validName, validSettings );
		registerFormatType( 'plugin/second', validSettings );
		expect( console ).toHaveErroredWith( 'Format "plugin/test" is already registered to handle bare tag name "test".' );
	} );

	it( 'should error on already registered className', () => {
		registerFormatType( validName, {
			...validSettings,
			className: 'test',
		} );
		registerFormatType( 'plugin/second', {
			...validSettings,
			className: 'test',
		} );
		expect( console ).toHaveErroredWith( 'Format "plugin/test" is already registered to handle class name "test".' );
	} );

	it( 'should error on empty title property', () => {
		registerFormatType( validName, {
			...validSettings,
			title: '',
		} );
		expect( console ).toHaveErroredWith( 'The format "plugin/test" must have a title.' );
	} );
} );
