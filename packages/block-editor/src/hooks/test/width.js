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
import '../width';

describe( 'custom width styles', () => {
	const blockSettings = {
		name: 'lorem/ipsum',
		save: noop,
		category: 'text',
		title: 'block title',
	};

	const settingsWithSupport = {
		...blockSettings,
		supports: {
			__experimentalWidth: true,
		},
	};

	const settingsWithoutSupport = {
		...blockSettings,
		supports: {
			__experimentalWidth: false,
		},
	};

	describe( 'addSaveProps', () => {
		const addSaveProps = applyFilters.bind(
			null,
			'blocks.getSaveContent.extraProps'
		);

		it( 'should do nothing if width support disabled', () => {
			const extraProps = addSaveProps( {}, settingsWithoutSupport, {
				style: { width: '75%' },
			} );
			expect( extraProps ).not.toHaveProperty( 'className' );
		} );

		it( 'should not add CSS class if custom width is not set', () => {
			const extraProps = addSaveProps( {}, settingsWithSupport, {
				style: {},
			} );
			expect( extraProps ).not.toHaveProperty( 'className' );
		} );

		it( 'should add CSS class if width supported and custom width set', () => {
			const extraProps = addSaveProps( {}, settingsWithSupport, {
				style: { border: { radius: 0 } },
			} );
			expect( extraProps ).toHaveProperty( 'className' );
		} );
	} );

	describe( 'addEditProps', () => {
		const addEditProps = applyFilters.bind(
			null,
			'blocks.registerBlockType'
		);

		it( 'should not modify edit wrapper props when width not supported', () => {
			const settings = addEditProps( blockSettings );
			// Test settings don't have getEditWrapperProps so should stay undefined.
			expect( settings.getEditWrapperProps ).toBeUndefined();
		} );

		it( 'should add getEditWrapperProps when width is supported', () => {
			const settings = addEditProps( settingsWithSupport );
			expect( settings.getEditWrapperProps ).toBeDefined();
		} );

		it( 'should add custom-width class to edit props when width is supported and width set', () => {
			const settings = addEditProps( settingsWithSupport );
			const props = settings.getEditWrapperProps( {
				style: { width: '75%' },
			} );
			expect( props.className ).toMatch( 'custom-width' );
		} );
	} );
} );
