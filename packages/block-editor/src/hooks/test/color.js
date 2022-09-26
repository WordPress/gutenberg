/**
 * External dependencies
 */
import { render } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { registerBlockType, unregisterBlockType } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import BlockEditorProvider from '../../components/provider';
import { cleanEmptyObject } from '../utils';
import { withColorPaletteStyles } from '../color';

describe( 'cleanEmptyObject', () => {
	it( 'should remove nested keys', () => {
		expect( cleanEmptyObject( { color: { text: undefined } } ) ).toEqual(
			undefined
		);
	} );
} );

describe( 'withColorPaletteStyles', () => {
	const settings = {
		__experimentalFeatures: {
			color: {
				palette: {
					default: [
						{
							name: 'Pale pink',
							slug: 'pale-pink',
							color: '#f78da7',
						},
						{
							name: 'Vivid green cyan',
							slug: 'vivid-green-cyan',
							color: '#00d084',
						},
					],
				},
			},
		},
	};

	const EnhancedComponent = withColorPaletteStyles(
		( { getStyleObj, wrapperProps } ) => (
			<div>{ getStyleObj( wrapperProps.style ) }</div>
		)
	);

	beforeAll( () => {
		registerBlockType( 'core/test-block', {
			save: () => undefined,
			edit: () => undefined,
			category: 'text',
			title: 'test block',
			supports: {
				color: {
					text: true,
					background: true,
				},
			},
		} );
	} );

	afterAll( () => {
		unregisterBlockType( 'core/test-block' );
	} );

	it( 'should add color styles from attributes', () => {
		const getStyleObj = jest.fn();

		render(
			<BlockEditorProvider settings={ settings } value={ [] }>
				<EnhancedComponent
					attributes={ {
						backgroundColor: 'vivid-green-cyan',
						textColor: 'pale-pink',
					} }
					name="core/test-block"
					getStyleObj={ getStyleObj }
				/>
			</BlockEditorProvider>
		);

		expect( getStyleObj ).toHaveBeenLastCalledWith( {
			color: '#f78da7',
			backgroundColor: '#00d084',
		} );
	} );

	it( 'should not add undefined style values', () => {
		// This test ensures that undefined `color` and `backgroundColor` styles
		// are not added to the styles object. An undefined `backgroundColor`
		// style causes a React warning when gradients are used, as the gradient
		// style currently uses the `background` shorthand syntax.
		// See: https://github.com/WordPress/gutenberg/issues/36899.
		const getStyleObj = jest.fn();

		render(
			<BlockEditorProvider settings={ settings } value={ [] }>
				<EnhancedComponent
					attributes={ {
						backgroundColor: undefined,
						textColor: undefined,
					} }
					name="core/test-block"
					getStyleObj={ getStyleObj }
				/>
			</BlockEditorProvider>
		);
		// Check explictly for the object used in the call, because
		// `toHaveBeenCalledWith` does not check for empty keys.
		expect(
			getStyleObj.mock.calls[ getStyleObj.mock.calls.length - 1 ][ 0 ]
		).toStrictEqual( {} );
	} );
} );
