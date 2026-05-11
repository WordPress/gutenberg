/**
 * Internal dependencies
 */
import { unregisterFormatTypeInBlock } from '../unregister-format-type-in-block';
import { registerFormatType } from '../register-format-type';
import { unregisterFormatType } from '../unregister-format-type';
import { getFormatTypes } from '../get-format-types';
import { store as richTextStore } from '../store';

const { select } = require( '@wordpress/data' );

const noop = () => {};

const defaultFormatSettings = {
	edit: noop,
	title: 'format title',
	tagName: 'test',
	className: null,
};

describe( 'unregisterFormatTypeInBlock', () => {
	beforeAll( () => {
		// Initialize the rich-text store.
		require( '../store' );
	} );

	afterEach( () => {
		getFormatTypes().forEach( ( format ) => {
			unregisterFormatType( format.name );
		} );
	} );

	it( 'should log an error if the format type is not registered', () => {
		const result = unregisterFormatTypeInBlock(
			'core/heading',
			'core/nonexistent'
		);

		expect( console ).toHaveErroredWith(
			'Format core/nonexistent is not registered.'
		);
		expect( result ).toBeUndefined();
	} );

	it( 'should return the format settings when successfully disabled', () => {
		registerFormatType( 'core/test-format', defaultFormatSettings );

		const result = unregisterFormatTypeInBlock(
			'core/heading',
			'core/test-format'
		);

		expect( console ).not.toHaveErrored();
		expect( result ).toEqual( {
			name: 'core/test-format',
			...defaultFormatSettings,
		} );
	} );

	it( 'should disable the format only for the specified block', () => {
		registerFormatType( 'core/test-format', defaultFormatSettings );

		unregisterFormatTypeInBlock( 'core/heading', 'core/test-format' );

		const disabledForHeading =
			select( richTextStore ).getDisabledFormatTypesForBlock(
				'core/heading'
			);
		const disabledForParagraph =
			select( richTextStore ).getDisabledFormatTypesForBlock(
				'core/paragraph'
			);

		expect( disabledForHeading ).toContain( 'core/test-format' );
		expect( disabledForParagraph ).not.toContain( 'core/test-format' );
	} );

	it( 'should not remove the format from the global registry', () => {
		registerFormatType( 'core/test-format', defaultFormatSettings );

		unregisterFormatTypeInBlock( 'core/heading', 'core/test-format' );

		expect( getFormatTypes() ).toEqual( [
			{ name: 'core/test-format', ...defaultFormatSettings },
		] );
	} );

	it( 'should support disabling multiple formats for the same block', () => {
		registerFormatType( 'core/test-format', defaultFormatSettings );
		registerFormatType( 'core/test-format-2', {
			...defaultFormatSettings,
			title: 'format title 2',
			tagName: 'test2',
		} );

		unregisterFormatTypeInBlock( 'core/heading', 'core/test-format' );
		unregisterFormatTypeInBlock( 'core/heading', 'core/test-format-2' );

		const disabled =
			select( richTextStore ).getDisabledFormatTypesForBlock(
				'core/heading'
			);

		expect( disabled ).toContain( 'core/test-format' );
		expect( disabled ).toContain( 'core/test-format-2' );
	} );
} );
