/**
 * External dependencies
 */
import { noop } from 'lodash';

/**
 * External dependencies
 */
import createHooks from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import anchor from '../anchor';

describe( 'anchor', () => {
	const hooks = createHooks();

	let blockSettings;
	beforeEach( () => {
		anchor( hooks );

		blockSettings = {
			save: noop,
			category: 'common',
			title: 'block title',
		};
	} );

	afterEach( () => {
		hooks.removeAllFilters( 'registerBlockType' );
		hooks.removeAllFilters( 'getSaveContent.extraProps' );
	} );

	describe( 'addAttribute()', () => {
		const addAttribute = hooks.applyFilters.bind( null, 'registerBlockType' );

		it( 'should do nothing if the block settings do not define anchor support', () => {
			const settings = addAttribute( blockSettings );

			expect( settings.attributes ).toBe( undefined );
		} );

		it( 'should assign a new anchor attribute', () => {
			const settings = addAttribute( {
				...blockSettings,
				supports: {
					anchor: true,
				},
			} );

			expect( settings.attributes ).toHaveProperty( 'anchor' );
		} );
	} );

	describe( 'addSaveProps', () => {
		const addSaveProps = hooks.applyFilters.bind( null, 'getSaveContent.extraProps' );

		it( 'should do nothing if the block settings do not define anchor support', () => {
			const attributes = { anchor: 'foo' };
			const extraProps = addSaveProps( blockSettings, attributes );

			expect( extraProps ).not.toHaveProperty( 'id' );
		} );

		it( 'should inject anchor attribute ID', () => {
			const attributes = { anchor: 'foo' };
			blockSettings = {
				...blockSettings,
				supports: {
					anchor: true,
				},
			};
			const extraProps = addSaveProps( {}, blockSettings, attributes );

			expect( extraProps.id ).toBe( 'foo' );
		} );
	} );
} );
