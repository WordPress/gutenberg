/**
 * External dependencies
 */
import { noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { applyFilters, removeAllFilters } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import customClassName from '../custom-class-name';

describe( 'custom className', () => {
	let blockSettings;
	beforeEach( () => {
		customClassName();

		blockSettings = {
			save: noop,
			category: 'common',
			title: 'block title',
		};
	} );

	afterEach( () => {
		removeAllFilters( 'blocks.registerBlockType' );
		removeAllFilters( 'blocks.getSaveContent.extraProps' );
	} );

	describe( 'addAttribute()', () => {
		const addAttribute = applyFilters.bind( null, 'blocks.registerBlockType' );

		it( 'should do nothing if the block settings disable custom className support', () => {
			const settings = addAttribute( {
				...blockSettings,
				supports: {
					customClassName: false,
				},
			} );

			expect( settings.attributes ).toBe( undefined );
		} );

		it( 'should assign a new custom className attribute', () => {
			const settings = addAttribute( blockSettings );

			expect( settings.attributes ).toHaveProperty( 'className' );
		} );
	} );

	describe( 'addSaveProps', () => {
		const addSaveProps = applyFilters.bind( null, 'blocks.getSaveContent.extraProps' );

		it( 'should do nothing if the block settings do not define custom className support', () => {
			const attributes = { className: 'foo' };
			const extraProps = addSaveProps( {}, {
				...blockSettings,
				supports: {
					customClassName: false,
				},
			}, attributes );

			expect( extraProps ).not.toHaveProperty( 'className' );
		} );

		it( 'should inject the custom className', () => {
			const attributes = { className: 'bar' };
			const extraProps = addSaveProps( { className: 'foo' }, blockSettings, attributes );

			expect( extraProps.className ).toBe( 'foo bar' );
		} );
	} );
} );
