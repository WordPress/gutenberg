/**
 * WordPress dependencies
 */
import { applyFilters } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import '../border';

const noop = () => {};

describe( 'border', () => {
	const blockSettings = {
		save: noop,
		category: 'text',
		title: 'block title',
	};

	describe( 'addAttributes()', () => {
		const registerBlockType = applyFilters.bind(
			null,
			'blocks.registerBlockType'
		);

		it( 'should assign a new borderColor attribute when attributes are omitted', () => {
			const settings = registerBlockType( {
				...blockSettings,
				supports: {
					__experimentalBorder: {
						color: true,
					},
				},
			} );

			expect( settings.attributes ).toEqual( {
				borderColor: {
					type: 'string',
				},
			} );
		} );

		it( 'should not override a borderColor attribute defined in settings', () => {
			const settings = registerBlockType( {
				...blockSettings,
				supports: {
					__experimentalBorder: {
						color: true,
					},
				},
				attributes: {
					borderColor: {
						type: 'string',
						default: 'primary',
					},
				},
			} );

			expect( settings.attributes.borderColor ).toEqual( {
				type: 'string',
				default: 'primary',
			} );
		} );
	} );
} );
