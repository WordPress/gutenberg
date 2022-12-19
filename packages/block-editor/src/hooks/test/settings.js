/**
 * WordPress dependencies
 */
import { applyFilters } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import '../settings';

describe( 'with settings', () => {
	const blockSettings = {
		save: () => <div className="default" />,
		category: 'text',
		title: 'block title',
	};

	describe( 'addAttribute', () => {
		const addAttribute = applyFilters.bind(
			null,
			'blocks.registerBlockType'
		);

		it( 'does not have settings att if settings block support is not enabled', () => {
			const settings = addAttribute( {
				...blockSettings,
				supports: {
					__experimentalSettings: false,
				},
			} );

			expect( settings.attributes ).toBe( undefined );
		} );

		it( 'has settings att if settings block supports is enabled', () => {
			const settings = addAttribute( {
				...blockSettings,
				supports: {
					__experimentalSettings: true,
				},
			} );

			expect( settings.attributes ).toStrictEqual( {
				settings: { type: 'object' },
			} );
		} );
	} );
} );
