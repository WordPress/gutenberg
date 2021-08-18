/**
 * WordPress dependencies
 */
import { applyFilters } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import '../custom-class-name';

describe( 'custom className', () => {
	const blockSettings = {
		save: () => <div className="default" />,
		category: 'text',
		title: 'block title',
	};

	describe( 'addAttribute()', () => {
		const addAttribute = applyFilters.bind(
			null,
			'blocks.registerBlockType'
		);

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
		const addSaveProps = applyFilters.bind(
			null,
			'blocks.getSaveContent.extraProps'
		);

		it( 'should do nothing if the block settings do not define custom className support', () => {
			const attributes = { className: 'foo' };
			const extraProps = addSaveProps(
				{},
				{
					...blockSettings,
					supports: {
						customClassName: false,
					},
				},
				attributes
			);

			expect( extraProps ).not.toHaveProperty( 'className' );
		} );

		it( 'should inject the custom className', () => {
			const attributes = { className: 'bar' };
			const extraProps = addSaveProps(
				{ className: 'foo' },
				blockSettings,
				attributes
			);

			expect( extraProps.className ).toBe( 'foo bar' );
		} );
	} );
} );
