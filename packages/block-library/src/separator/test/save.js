/**
 * External dependencies
 */
import { render } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { useBlockProps } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import separatorSave from '../save';

jest.mock( '@wordpress/block-editor', () => ( {
	...jest.requireActual( '@wordpress/block-editor' ),
	useBlockProps: {
		save: jest.fn( ( props ) => props ),
	},
} ) );

const defaultAttributes = {
	backgroundColor: undefined,
	opacity: 'alpha-channel',
	style: {},
	tagName: 'hr',
	isDecorative: true,
};

describe( 'Separator block save method', () => {
	beforeEach( () => {
		useBlockProps.save.mockClear();
	} );

	describe( 'aria attributes for decorative separators', () => {
		test( 'should pass role="none" and aria-label="" for decorative hr', () => {
			render( separatorSave( { attributes: defaultAttributes } ) );
			expect( useBlockProps.save ).toHaveBeenCalledWith(
				expect.objectContaining( {
					role: 'none',
					'aria-label': '',
				} )
			);
		} );

		test( 'should not pass role or aria-label for non-decorative hr', () => {
			const attributes = { ...defaultAttributes, isDecorative: false };
			render( separatorSave( { attributes } ) );
			const callArgs = useBlockProps.save.mock.calls[ 0 ][ 0 ];
			expect( callArgs ).not.toHaveProperty( 'role' );
			expect( callArgs ).not.toHaveProperty( 'aria-label' );
		} );

		test( 'should not pass role or aria-label for decorative div (divs are always decorative via CSS, aria not needed)', () => {
			const attributes = {
				...defaultAttributes,
				tagName: 'div',
				isDecorative: true,
			};
			render( separatorSave( { attributes } ) );
			const callArgs = useBlockProps.save.mock.calls[ 0 ][ 0 ];
			expect( callArgs ).not.toHaveProperty( 'role' );
			expect( callArgs ).not.toHaveProperty( 'aria-label' );
		} );
	} );

	describe( 'className and styles', () => {
		test( 'should add has-alpha-channel-opacity class by default', () => {
			render( separatorSave( { attributes: defaultAttributes } ) );
			expect( useBlockProps.save ).toHaveBeenCalledWith(
				expect.objectContaining( {
					className: expect.stringContaining(
						'has-alpha-channel-opacity'
					),
				} )
			);
		} );

		test( 'should add has-css-opacity class for deprecated opacity value', () => {
			const attributes = { ...defaultAttributes, opacity: 'css' };
			render( separatorSave( { attributes } ) );
			expect( useBlockProps.save ).toHaveBeenCalledWith(
				expect.objectContaining( {
					className: expect.stringContaining( 'has-css-opacity' ),
				} )
			);
		} );

		test( 'should pass no inline styles when no custom color is set', () => {
			render( separatorSave( { attributes: defaultAttributes } ) );
			expect( useBlockProps.save ).toHaveBeenCalledWith(
				expect.objectContaining( {
					style: { backgroundColor: undefined, color: undefined },
				} )
			);
		} );
	} );
} );
