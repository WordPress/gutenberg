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
import '../font-style';

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

	describe( 'addAttribute()', () => {
		const addAttribute = applyFilters.bind(
			null,
			'blocks.registerBlockType'
		);

		it( 'should do nothing if the settings do not define font style support', () => {
			const settings = addAttribute( blockSettings );
			expect( settings.attributes ).toBeUndefined();
		} );

		it( 'should do nothing if the settings disable font style support', () => {
			const settings = addAttribute( settingsWithoutSupport );
			expect( settings.attributes ).toBeUndefined();
		} );

		it( 'should assign a new font style attribute', () => {
			const settings = addAttribute( settingsWithSupport );
			expect( settings.attributes ).toHaveProperty( 'fontStyle' );
		} );
	} );

	describe( 'addSaveProps', () => {
		const addSaveProps = applyFilters.bind(
			null,
			'blocks.getSaveContent.extraProps'
		);

		it( 'should do nothing if font style support disabled', () => {
			const extraProps = addSaveProps( {}, settingsWithoutSupport, {
				fontStyle: 'italic',
			} );
			expect( extraProps ).not.toHaveProperty( 'className' );
		} );

		it( 'should not add CSS class if font style is not set', () => {
			const extraProps = addSaveProps( {}, settingsWithSupport, {} );
			expect( extraProps ).not.toHaveProperty( 'className' );
		} );

		it( 'should add CSS classes if font style is present', () => {
			const extraProps = addSaveProps( {}, settingsWithSupport, {
				fontStyle: 'italic',
			} );
			expect( extraProps.className ).toMatch( 'has-font-style' );
			expect( extraProps.className ).toMatch( 'has-italic-font-style' );
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
			const props = settings.getEditWrapperProps( {
				fontStyle: 'italic',
			} );
			expect( props.className ).toMatch( 'has-font-style' );
			expect( props.className ).toMatch( 'has-italic-font-style' );
		} );
	} );
} );
