/**
 * WordPress dependencies
 */
import { applyFilters } from '@wordpress/hooks';
import {
	registerBlockType,
	unregisterBlockType,
	registerBlockVariation,
	unregisterBlockVariation,
	getBlockType,
} from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import '../generated-variation-class-name';

describe( 'generated variation className', () => {
	const defaultBlockSettings = {
		attributes: {
			fruit: {
				type: 'string',
				default: 'Bananas',
				source: 'text',
				selector: 'div',
			},
		},
		save: ( { attributes } ) => (
			<div className={ attributes.className }>{ attributes.fruit }</div>
		),
		category: 'text',
		title: 'block title',
	};

	const variationBlockSettings = {
		attributes: {
			fruit: 'Apples',
		},
		isActive: ( { fruit } ) => fruit === 'Apples',
	};

	beforeAll( () => {
		registerBlockType( 'core/test-block', {
			...defaultBlockSettings,
		} );

		registerBlockVariation( 'core/test-block', {
			name: 'variation',
			title: 'Variation',
			...variationBlockSettings,
		} );
	} );

	afterAll( () => {
		unregisterBlockType( 'core/test-block' );
		unregisterBlockVariation( 'core/test-block', 'variation' );
	} );

	describe( 'addSaveProps', () => {
		const addSaveProps = applyFilters.bind(
			null,
			'blocks.getSaveContent.extraProps'
		);

		it( 'should do nothing if the block settings do not define generated className support', () => {
			const attributes = { className: 'foo' };
			const extraProps = addSaveProps(
				{},
				{
					...defaultBlockSettings,
					supports: {
						className: false,
					},
				},
				attributes
			);

			expect( extraProps ).not.toHaveProperty( 'className' );
		} );

		it( 'should inject the generated className', () => {
			const attributes = { fruit: 'Apples' };
			const blockType = getBlockType( 'core/test-block' );
			const extraProps = addSaveProps(
				{ className: 'foo' },
				blockType,
				attributes
			);

			expect( extraProps.className ).toContain(
				'wp-block-test-block-variation'
			);
		} );

		it( 'should not inject duplicates into className', () => {
			const attributes = { fruit: 'Apples' };
			const blockType = getBlockType( 'core/test-block' );
			const extraProps = addSaveProps(
				{ className: 'foo wp-block-test-block-variation' },
				blockType,
				attributes
			);

			expect( extraProps.className ).toBe(
				'wp-block-test-block-variation foo'
			);
		} );
	} );
} );
