/**
 * WordPress dependencies
 */
import { registerBlockType, unregisterBlockType } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { settings } from '../index';

describe( 'Navigation Link Block Labelling', () => {
	beforeEach( () => {
		// Register the navigation link block for testing
		registerBlockType( 'core/navigation-link', {
			...settings,
			name: 'core/navigation-link',
			title: 'Navigation Link', // Add required title
			category: 'design', // Add required category
			attributes: {}, // Add required attributes
		} );
	} );

	afterEach( () => {
		// Clean up
		unregisterBlockType( 'core/navigation-link' );
	} );

	describe( 'appender context', () => {
		it( 'should return "page" for post-type with type "page"', () => {
			const attributes = {
				kind: 'post-type',
				type: 'page',
			};

			const result = settings.__experimentalLabel( attributes, {
				context: 'appender',
			} );

			expect( result ).toBe( 'page' );
		} );

		it( 'should return "post" for post-type with type "post"', () => {
			const attributes = {
				kind: 'post-type',
				type: 'post',
			};

			const result = settings.__experimentalLabel( attributes, {
				context: 'appender',
			} );

			expect( result ).toBe( 'post' );
		} );

		it( 'should return "category" for taxonomy with type "category"', () => {
			const attributes = {
				kind: 'taxonomy',
				type: 'category',
			};

			const result = settings.__experimentalLabel( attributes, {
				context: 'appender',
			} );

			expect( result ).toBe( 'category' );
		} );

		it( 'should return "tag" for taxonomy with type "post_tag"', () => {
			const attributes = {
				kind: 'taxonomy',
				type: 'post_tag',
			};

			const result = settings.__experimentalLabel( attributes, {
				context: 'appender',
			} );

			expect( result ).toBe( 'post_tag' );
		} );

		it( 'should return "link" for unknown kind', () => {
			const attributes = {
				kind: 'unknown',
				type: 'something',
			};

			const result = settings.__experimentalLabel( attributes, {
				context: 'appender',
			} );

			expect( result ).toBe( 'link' );
		} );

		it( 'should return "link" when kind is missing', () => {
			const attributes = {
				type: 'page',
			};

			const result = settings.__experimentalLabel( attributes, {
				context: 'appender',
			} );

			expect( result ).toBe( 'link' );
		} );

		it( 'should return "link" when attributes are empty', () => {
			const attributes = {};

			const result = settings.__experimentalLabel( attributes, {
				context: 'appender',
			} );

			expect( result ).toBe( 'link' );
		} );

		it( 'should return "link" when attributes are null', () => {
			const result = settings.__experimentalLabel( null, {
				context: 'appender',
			} );

			expect( result ).toBe( 'link' );
		} );

		it( 'should return "link" when attributes are undefined', () => {
			const result = settings.__experimentalLabel( undefined, {
				context: 'appender',
			} );

			expect( result ).toBe( 'link' );
		} );

		it( 'should handle custom post types', () => {
			const attributes = {
				kind: 'post-type',
				type: 'product',
			};

			const result = settings.__experimentalLabel( attributes, {
				context: 'appender',
			} );

			expect( result ).toBe( 'product' );
		} );

		it( 'should handle custom taxonomies', () => {
			const attributes = {
				kind: 'taxonomy',
				type: 'product_category',
			};

			const result = settings.__experimentalLabel( attributes, {
				context: 'appender',
			} );

			expect( result ).toBe( 'product_category' );
		} );
	} );

	describe( 'other contexts', () => {
		it( 'should return label for list-view context', () => {
			const attributes = {
				label: 'Home Page',
			};

			const result = settings.__experimentalLabel( attributes, {
				context: 'list-view',
			} );

			expect( result ).toBe( 'Home Page' );
		} );

		it( 'should return undefined for unknown context', () => {
			const attributes = {
				kind: 'post-type',
				type: 'page',
			};

			const result = settings.__experimentalLabel( attributes, {
				context: 'unknown',
			} );

			expect( result ).toBeUndefined();
		} );

		it( 'should return undefined when no context is provided', () => {
			const attributes = {
				kind: 'post-type',
				type: 'page',
			};

			const result = settings.__experimentalLabel( attributes, {} );

			expect( result ).toBeUndefined();
		} );
	} );

	describe( 'Navigation Block DEFAULT_BLOCK integration', () => {
		it( 'should work with Navigation block default block attributes', () => {
			// This simulates the DEFAULT_BLOCK from Navigation block constants
			const defaultBlockAttributes = {
				kind: 'post-type',
				type: 'page',
			};

			const result = settings.__experimentalLabel(
				defaultBlockAttributes,
				{
					context: 'appender',
				}
			);

			expect( result ).toBe( 'page' );
		} );

		it( 'should work with Navigation block default block for posts', () => {
			const defaultBlockAttributes = {
				kind: 'post-type',
				type: 'post',
			};

			const result = settings.__experimentalLabel(
				defaultBlockAttributes,
				{
					context: 'appender',
				}
			);

			expect( result ).toBe( 'post' );
		} );
	} );
} );
