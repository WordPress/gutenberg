/**
 * WordPress dependencies
 */
import { applyFilters } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import '../generated-class-name';

const noop = () => {};

describe( 'generated className', () => {
	const blockSettings = {
		name: 'produce/fruit',
		save: noop,
		category: 'text',
		title: 'block title',
	};

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
					...blockSettings,
					supports: {
						className: false,
					},
				},
				attributes
			);

			expect( extraProps ).not.toHaveProperty( 'className' );
		} );

		it( 'should inject the generated className', () => {
			const attributes = { className: 'bar' };
			const extraProps = addSaveProps(
				{ className: 'foo' },
				blockSettings,
				attributes
			);

			expect( extraProps.className ).toBe( 'wp-block-produce-fruit foo' );
		} );

		it( 'should not inject duplicates into className', () => {
			const attributes = { className: 'bar' };
			const extraProps = addSaveProps(
				{ className: 'foo wp-block-produce-fruit' },
				blockSettings,
				attributes
			);

			expect( extraProps.className ).toBe( 'wp-block-produce-fruit foo' );
		} );
	} );
} );
