/**
 * External dependencies
 */
import { noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { applyFilters } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import { fontStyleClasses } from '../font-style';

describe( 'custom font styles', () => {
	const blockSettings = {
		name: 'lorem/ipsum',
		save: noop,
		category: 'text',
		title: 'block title',
	};

	const settingsWithSupport = {
		...blockSettings,
		supports: {
			__experimentalFontStyle: true,
		},
	};

	const settingsWithoutSupport = {
		...blockSettings,
		supports: {
			__experimentalFontStyle: false,
		},
	};

	const styles = {
		style: {
			typography: {
				fontStyles: {
					bold: true,
					italic: true,
					underline: true,
					strikethrough: true,
				},
			},
		}
	};

	describe( 'addSaveProps', () => {
		const addSaveProps = applyFilters.bind(
			null,
			'blocks.getSaveContent.extraProps'
		);

		it( 'should do nothing if font style support disabled', () => {
			const props = addSaveProps( {}, settingsWithoutSupport, styles );
			expect( props ).not.toHaveProperty( 'className' );
		} );

		it( 'should not add CSS class if font style is not set', () => {
			const props = addSaveProps( {}, settingsWithSupport, {} );
			expect( props ).not.toHaveProperty( 'className' );
		} );

		it( 'should add CSS classes if font style is present', () => {
			const props = addSaveProps( {}, settingsWithSupport, styles );
			expect( props.className ).toMatch( 'has-font-style' );
			expect( props.className ).toMatch( fontStyleClasses.bold );
			expect( props.className ).toMatch( fontStyleClasses.italic );
			expect( props.className ).toMatch( fontStyleClasses.underline );
			expect( props.className ).toMatch( fontStyleClasses.strikethrough );
		} );
	} );

	describe( 'addEditProps', () => {
		const addEditProps = applyFilters.bind(
			null,
			'blocks.registerBlockType'
		);

		it( 'should not modify edit wrapper props when no font style support', () => {
			const settings = addEditProps( blockSettings );
			// Test settings don't have getEditWrapperProps so should stay undefined.
			expect( settings.getEditWrapperProps ).toBeUndefined();
		} );

		it( 'should add getEditWrapperProps when font style is supported', () => {
			const settings = addEditProps( settingsWithSupport );
			expect( settings.getEditWrapperProps ).toBeDefined();
		} );

		it( 'should add css classes to edit props when font style is supported', () => {
			const settings = addEditProps( settingsWithSupport );
			const props = settings.getEditWrapperProps( styles );
			expect( props.className ).toMatch( 'has-font-style' );
			expect( props.className ).toMatch( fontStyleClasses.bold );
			expect( props.className ).toMatch( fontStyleClasses.italic );
			expect( props.className ).toMatch( fontStyleClasses.underline );
			expect( props.className ).toMatch( fontStyleClasses.strikethrough );
		} );
	} );
} );
