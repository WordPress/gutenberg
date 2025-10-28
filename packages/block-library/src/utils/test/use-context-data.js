/**
 * Internal dependencies
 */
import {
	parseTemplateSlug,
	parseTemplateSlugWithValidation,
} from '../use-context-data';

describe( 'parseTemplateSlug', () => {
	it( 'should handle empty template slug', () => {
		const result = parseTemplateSlug( '' );
		expect( result ).toEqual( {
			taxonomy: null,
			termSlug: null,
			isAuthor: false,
			authorSlug: null,
		} );
	} );

	it( 'should handle null template slug', () => {
		const result = parseTemplateSlug( null );
		expect( result ).toEqual( {
			taxonomy: null,
			termSlug: null,
			isAuthor: false,
			authorSlug: null,
		} );
	} );

	it( 'should handle author patterns', () => {
		const resultAuthor = parseTemplateSlug( 'author' );
		expect( resultAuthor ).toEqual( {
			taxonomy: null,
			termSlug: null,
			isAuthor: true,
			authorSlug: null,
		} );

		const resultAuthorJohnDoe = parseTemplateSlug( 'author-john-doe' );
		expect( resultAuthorJohnDoe ).toEqual( {
			taxonomy: null,
			termSlug: null,
			isAuthor: true,
			authorSlug: 'john-doe',
		} );
	} );

	it( 'should handle built-in taxonomy patterns', () => {
		const resultCategory = parseTemplateSlug( 'category' );
		expect( resultCategory ).toEqual( {
			taxonomy: 'category',
			termSlug: null,
			isAuthor: false,
			authorSlug: null,
		} );

		const resultTag = parseTemplateSlug( 'tag' );
		expect( resultTag ).toEqual( {
			taxonomy: 'post_tag',
			termSlug: null,
			isAuthor: false,
			authorSlug: null,
		} );
	} );

	it( 'should handle built-in taxonomy term patterns', () => {
		const resultCategoryNews = parseTemplateSlug( 'category-news' );
		expect( resultCategoryNews ).toEqual( {
			taxonomy: 'category',
			termSlug: 'news',
			isAuthor: false,
			authorSlug: null,
		} );

		const resultTagFeatured = parseTemplateSlug( 'tag-featured' );
		expect( resultTagFeatured ).toEqual( {
			taxonomy: 'post_tag',
			termSlug: 'featured',
			isAuthor: false,
			authorSlug: null,
		} );
	} );

	it( 'should handle custom taxonomy patterns without dashes', () => {
		const result = parseTemplateSlug( 'taxonomy-product' );
		expect( result ).toEqual( {
			taxonomy: 'product',
			termSlug: null,
			isAuthor: false,
			authorSlug: null,
		} );
	} );

	it( 'should handle custom taxonomy patterns with single dash', () => {
		const result = parseTemplateSlug( 'taxonomy-product-category' );
		expect( result ).toEqual( {
			taxonomy: 'product-category',
			termSlug: null,
			isAuthor: false,
			authorSlug: null,
		} );
	} );

	it( 'should handle custom taxonomy patterns with multiple dashes', () => {
		const result = parseTemplateSlug(
			'taxonomy-product-category-electronics'
		);
		expect( result ).toEqual( {
			taxonomy: 'product-category',
			termSlug: 'electronics',
			isAuthor: false,
			authorSlug: null,
		} );
	} );

	it( 'should handle complex custom taxonomy patterns', () => {
		const resultComplexCustomTaxonomy = parseTemplateSlug(
			'taxonomy-product-category-sub-category-item'
		);
		expect( resultComplexCustomTaxonomy ).toEqual( {
			taxonomy: 'product-category-sub-category',
			termSlug: 'item',
			isAuthor: false,
			authorSlug: null,
		} );
	} );

	it( 'should handle unknown patterns', () => {
		const result = parseTemplateSlug( 'unknown-pattern' );
		expect( result ).toEqual( {
			taxonomy: null,
			termSlug: null,
			isAuthor: false,
			authorSlug: null,
		} );
	} );
} );

describe( 'parseTemplateSlugWithValidation', () => {
	const mockGetTaxonomy = jest.fn();

	beforeEach( () => {
		mockGetTaxonomy.mockClear();
	} );

	it( 'should return basic parse result when taxonomy exists', () => {
		mockGetTaxonomy.mockImplementation( ( taxonomy ) => {
			if ( taxonomy === 'product-category' ) {
				return { name: 'Product Category' };
			}
			return null;
		} );

		const result = parseTemplateSlugWithValidation(
			'taxonomy-product-category',
			mockGetTaxonomy
		);
		expect( result ).toEqual( {
			taxonomy: 'product-category',
			termSlug: null,
			isAuthor: false,
			authorSlug: null,
		} );
	} );

	it( 'should handle author patterns without validation', () => {
		mockGetTaxonomy.mockReturnValue( null );

		const result = parseTemplateSlugWithValidation(
			'author-john-doe',
			mockGetTaxonomy
		);
		expect( result ).toEqual( {
			taxonomy: null,
			termSlug: null,
			isAuthor: true,
			authorSlug: 'john-doe',
		} );
	} );

	it( 'should handle built-in taxonomies with validation', () => {
		mockGetTaxonomy.mockReturnValue( { name: 'Category' } );

		const result = parseTemplateSlugWithValidation(
			'category',
			mockGetTaxonomy
		);
		expect( result ).toEqual( {
			taxonomy: 'category',
			termSlug: null,
			isAuthor: false,
			authorSlug: null,
		} );
	} );

	it( 'should handle custom taxonomy with validation', () => {
		mockGetTaxonomy.mockImplementation( ( taxonomy ) => {
			if ( taxonomy === 'product-category' ) {
				return { name: 'Product Category' };
			}
			return null;
		} );

		const result = parseTemplateSlugWithValidation(
			'taxonomy-product-category-electronics-gadgets',
			mockGetTaxonomy
		);
		expect( result ).toEqual( {
			taxonomy: 'product-category',
			termSlug: 'electronics-gadgets',
			isAuthor: false,
			authorSlug: null,
		} );
	} );

	it( 'should return null values when taxonomy does not exist', () => {
		mockGetTaxonomy.mockReturnValue( null );

		const result = parseTemplateSlugWithValidation(
			'taxonomy-nonexistent-taxonomy',
			mockGetTaxonomy
		);
		expect( result ).toEqual( {
			taxonomy: null,
			termSlug: null,
			isAuthor: false,
			authorSlug: null,
		} );
	} );

	it( 'should fallback to entire string if no valid split found', () => {
		mockGetTaxonomy.mockImplementation( ( taxonomy ) => {
			if ( taxonomy === 'coffee_type-flat-white' ) {
				return { name: 'Coffee Type Flat White' };
			}
			return null;
		} );

		const result = parseTemplateSlugWithValidation(
			'taxonomy-coffee_type-flat-white',
			mockGetTaxonomy
		);

		expect( result ).toEqual( {
			taxonomy: 'coffee_type-flat-white',
			termSlug: null,
			isAuthor: false,
			authorSlug: null,
		} );
	} );
} );
