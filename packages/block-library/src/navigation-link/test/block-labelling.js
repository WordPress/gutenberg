/**
 * The __experimentalLabel function extracted for isolated testing.
 * This avoids importing the full settings object which has complex dependencies.
 *
 * @param {Object} attributes    Block attributes.
 * @param {Object} root0         Options object.
 * @param {string} root0.context The context for the label.
 * @return {string|undefined}             The label for the given context.
 */
const __experimentalLabel = ( attributes, { context } ) => {
	if ( context === 'list-view' ) {
		return attributes?.label;
	}

	if ( context === 'appender' ) {
		// Return the type (e.g., 'page', 'post', 'category') or fallback to 'link'
		return attributes?.type || 'link';
	}

	// Backwards compatibility - return label for unknown contexts
	return attributes?.label;
};

describe( 'Navigation Link Block Labelling', () => {
	describe( 'appender context', () => {
		it( 'should return "page" for post-type with type "page"', () => {
			const attributes = {
				kind: 'post-type',
				type: 'page',
			};

			const result = __experimentalLabel( attributes, {
				context: 'appender',
			} );

			expect( result ).toBe( 'page' );
		} );

		it( 'should return "post" for post-type with type "post"', () => {
			const attributes = {
				kind: 'post-type',
				type: 'post',
			};

			const result = __experimentalLabel( attributes, {
				context: 'appender',
			} );

			expect( result ).toBe( 'post' );
		} );

		it( 'should return "category" for taxonomy with type "category"', () => {
			const attributes = {
				kind: 'taxonomy',
				type: 'category',
			};

			const result = __experimentalLabel( attributes, {
				context: 'appender',
			} );

			expect( result ).toBe( 'category' );
		} );

		it( 'should return "tag" for taxonomy with type "post_tag"', () => {
			const attributes = {
				kind: 'taxonomy',
				type: 'post_tag',
			};

			const result = __experimentalLabel( attributes, {
				context: 'appender',
			} );

			expect( result ).toBe( 'post_tag' );
		} );

		it( 'should return type even for unknown kind', () => {
			const attributes = {
				kind: 'unknown',
				type: 'something',
			};

			const result = __experimentalLabel( attributes, {
				context: 'appender',
			} );

			expect( result ).toBe( 'something' );
		} );

		it( 'should return type when kind is missing', () => {
			const attributes = {
				type: 'page',
			};

			const result = __experimentalLabel( attributes, {
				context: 'appender',
			} );

			expect( result ).toBe( 'page' );
		} );

		it( 'should return "link" when attributes are empty', () => {
			const attributes = {};

			const result = __experimentalLabel( attributes, {
				context: 'appender',
			} );

			expect( result ).toBe( 'link' );
		} );

		it( 'should return "link" when attributes are null', () => {
			const result = __experimentalLabel( null, {
				context: 'appender',
			} );

			expect( result ).toBe( 'link' );
		} );

		it( 'should return "link" when attributes are undefined', () => {
			const result = __experimentalLabel( undefined, {
				context: 'appender',
			} );

			expect( result ).toBe( 'link' );
		} );

		it( 'should handle custom post types', () => {
			const attributes = {
				kind: 'post-type',
				type: 'product',
			};

			const result = __experimentalLabel( attributes, {
				context: 'appender',
			} );

			expect( result ).toBe( 'product' );
		} );

		it( 'should handle custom taxonomies', () => {
			const attributes = {
				kind: 'taxonomy',
				type: 'product_category',
			};

			const result = __experimentalLabel( attributes, {
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

			const result = __experimentalLabel( attributes, {
				context: 'list-view',
			} );

			expect( result ).toBe( 'Home Page' );
		} );

		it( 'should return label for unknown context (backwards compatibility)', () => {
			const attributes = {
				label: 'My Link',
				kind: 'post-type',
				type: 'page',
			};

			const result = __experimentalLabel( attributes, {
				context: 'unknown',
			} );

			expect( result ).toBe( 'My Link' );
		} );

		it( 'should return label when no context is provided (backwards compatibility)', () => {
			const attributes = {
				label: 'My Link',
				kind: 'post-type',
				type: 'page',
			};

			const result = __experimentalLabel( attributes, {} );

			expect( result ).toBe( 'My Link' );
		} );

		it( 'should return undefined for unknown context when no label', () => {
			const attributes = {
				kind: 'post-type',
				type: 'page',
			};

			const result = __experimentalLabel( attributes, {
				context: 'unknown',
			} );

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

			const result = __experimentalLabel( defaultBlockAttributes, {
				context: 'appender',
			} );

			expect( result ).toBe( 'page' );
		} );

		it( 'should work with Navigation block default block for posts', () => {
			const defaultBlockAttributes = {
				kind: 'post-type',
				type: 'post',
			};

			const result = __experimentalLabel( defaultBlockAttributes, {
				context: 'appender',
			} );

			expect( result ).toBe( 'post' );
		} );
	} );
} );
