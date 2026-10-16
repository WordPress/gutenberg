import { describe, expect, it } from 'vitest';
import { applyFilters } from '@wordpress/hooks';
import customClassName from '../custom-class-name';

describe( 'custom className', () => {
	const getBlockSettings = () => ( {
		save: () => <div className="default" />,
		category: 'text',
		title: 'block title',
	} );
	const blockType = {
		...getBlockSettings(),
		name: 'core/test-block',
		icon: { src: 'block-default' },
		attributes: {},
	};

	describe( 'addAttribute()', () => {
		// Filters return `unknown`; this one returns the block settings.
		const addAttribute = applyFilters.bind(
			null,
			'blocks.registerBlockType'
		) as ( ...args: unknown[] ) => Record< string, unknown >;

		it( 'should do nothing if the block settings disable custom className support', () => {
			const settings = addAttribute( {
				...getBlockSettings(),
				supports: {
					customClassName: false,
				},
			} );

			expect( settings.attributes ).toBe( undefined );
		} );

		it( 'should assign a new custom className attribute', () => {
			const settings = addAttribute( getBlockSettings() );

			expect( settings.attributes ).toHaveProperty( 'className' );
		} );
	} );

	describe( 'addSaveProps', () => {
		it( 'should do nothing if the block settings do not define custom className support', () => {
			const attributes = { className: 'foo' };
			const extraProps = customClassName.addSaveProps(
				{},
				{
					...blockType,
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
			const extraProps = customClassName.addSaveProps(
				{ className: 'foo' },
				blockType,
				attributes
			);

			expect( extraProps.className ).toBe( 'foo bar' );
		} );
	} );
} );
