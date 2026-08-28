import { applyFilters } from '@wordpress/hooks';
import globalAttributes, { addSaveProps } from '../global-attributes';

const noop = () => {};

describe( 'globalAttributes', () => {
	const blockSettings = {
		save: noop,
		category: 'text',
		title: 'block title',
	};

	describe( 'addAttribute()', () => {
		const registerBlockType = applyFilters.bind(
			null,
			'blocks.registerBlockType'
		);

		it( 'should assign a globalAttributes attribute by default', () => {
			const settings = registerBlockType( { ...blockSettings } );

			expect( settings.attributes ).toHaveProperty( 'globalAttributes' );
		} );

		it( 'should do nothing if the block opts out of the support', () => {
			const settings = registerBlockType( {
				...blockSettings,
				supports: {
					globalAttributes: false,
				},
			} );

			expect( settings.attributes ).toBe( undefined );
		} );

		it( 'should not override an attribute defined in settings', () => {
			const settings = registerBlockType( {
				...blockSettings,
				attributes: {
					globalAttributes: {
						type: 'object',
						default: { role: 'list' },
					},
				},
			} );

			expect( settings.attributes.globalAttributes.default ).toEqual( {
				role: 'list',
			} );
		} );
	} );

	describe( 'addSaveProps()', () => {
		it( 'should do nothing if there are no global attributes', () => {
			const props = addSaveProps( {}, blockSettings, {} );

			expect( props ).toEqual( {} );
		} );

		it( 'should inject the allowed global attributes', () => {
			const props = addSaveProps( {}, blockSettings, {
				globalAttributes: {
					'aria-describedby': 'test',
					role: 'list',
				},
			} );

			expect( props ).toEqual( {
				'aria-describedby': 'test',
				role: 'list',
			} );
		} );

		it( 'should not serialize keys outside the allow list', () => {
			const props = addSaveProps( {}, blockSettings, {
				globalAttributes: {
					onclick: 'alert(1)',
					'data-foo': 'bar',
					style: 'color:red',
					'aria-describedby': 'test',
				},
			} );

			expect( props ).toEqual( { 'aria-describedby': 'test' } );
		} );

		it( 'should skip empty values so they are not written to markup', () => {
			const props = addSaveProps( {}, blockSettings, {
				globalAttributes: { role: '' },
			} );

			expect( props ).toEqual( {} );
		} );

		it( 'should do nothing if the block opts out of the support', () => {
			const props = addSaveProps(
				{},
				{ ...blockSettings, supports: { globalAttributes: false } },
				{ globalAttributes: { role: 'list' } }
			);

			expect( props ).toEqual( {} );
		} );
	} );

	it( 'declares the attribute keys used by the save filter', () => {
		expect( globalAttributes.attributeKeys ).toEqual( [
			'globalAttributes',
		] );
	} );
} );
