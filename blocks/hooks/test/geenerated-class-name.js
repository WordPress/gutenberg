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
import generatedClassName from '../generated-class-name';

describe( 'generated className', () => {
	const hooks = createHooks();

	let blockSettings;
	beforeEach( () => {
		generatedClassName( hooks );

		blockSettings = {
			name: 'chicken/ribs',
			save: noop,
			category: 'common',
			title: 'block title',
		};
	} );

	afterEach( () => {
		hooks.removeAllFilters( 'getSaveContent.extraProps' );
	} );

	describe( 'addSaveProps', () => {
		const addSaveProps = hooks.applyFilters.bind( null, 'getSaveContent.extraProps' );

		it( 'should do nothing if the block settings do not define generated className support', () => {
			const attributes = { className: 'foo' };
			const extraProps = addSaveProps( {}, {
				...blockSettings,
				supports: {
					generatedClassName: false,
				},
			}, attributes );

			expect( extraProps ).not.toHaveProperty( 'className' );
		} );

		it( 'should inject the generated className', () => {
			const attributes = { className: 'bar' };
			const extraProps = addSaveProps( { className: 'foo' }, blockSettings, attributes );

			expect( extraProps.className ).toBe( 'wp-block-chicken-ribs foo' );
		} );
	} );
} );
