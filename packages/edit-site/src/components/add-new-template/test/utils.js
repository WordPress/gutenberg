/**
 * Internal dependencies
 */
/**
 * Internal dependencies
 */
import { getTemplateHierarchy } from '../utils';

describe( 'add new template utils', () => {
	describe( 'getTemplateHierarchy', () => {
		it( 'front-page', () => {
			const result = getTemplateHierarchy( 'front-page' );
			expect( result ).toEqual( [ 'front-page', 'home', 'index' ] );
		} );
		it( 'custom templates', () => {
			const result = getTemplateHierarchy( 'whatever-slug', {
				isCustom: true,
			} );
			expect( result ).toEqual( [ 'page', 'singular', 'index' ] );
		} );
		it( 'single slug templates(ex. page, tag, author, etc..)', () => {
			let result = getTemplateHierarchy( 'page' );
			expect( result ).toEqual( [ 'page', 'singular', 'index' ] );
			result = getTemplateHierarchy( 'tag' );
			expect( result ).toEqual( [ 'tag', 'archive', 'index' ] );
			result = getTemplateHierarchy( 'author' );
			expect( result ).toEqual( [ 'author', 'archive', 'index' ] );
			result = getTemplateHierarchy( 'date' );
			expect( result ).toEqual( [ 'date', 'archive', 'index' ] );
			result = getTemplateHierarchy( 'taxonomy' );
			expect( result ).toEqual( [ 'taxonomy', 'archive', 'index' ] );
			result = getTemplateHierarchy( 'attachment' );
			expect( result ).toEqual( [
				'attachment',
				'single',
				'singular',
				'index',
			] );
			result = getTemplateHierarchy( 'singular' );
			expect( result ).toEqual( [ 'singular', 'index' ] );
			result = getTemplateHierarchy( 'single' );
			expect( result ).toEqual( [ 'single', 'singular', 'index' ] );
			result = getTemplateHierarchy( 'archive' );
			expect( result ).toEqual( [ 'archive', 'index' ] );
			result = getTemplateHierarchy( 'index' );
			expect( result ).toEqual( [ 'index' ] );
		} );
		it( 'taxonomies', () => {
			let result = getTemplateHierarchy( 'taxonomy-books', {
				templatePrefix: 'taxonomy-books',
			} );
			expect( result ).toEqual( [
				'taxonomy-books',
				'taxonomy',
				'archive',
				'index',
			] );
			// Single word category.
			result = getTemplateHierarchy( 'category-fruits', {
				templatePrefix: 'category',
			} );
			expect( result ).toEqual( [
				'category-fruits',
				'category',
				'archive',
				'index',
			] );
			// Multi word category.
			result = getTemplateHierarchy( 'category-fruits-yellow', {
				templatePrefix: 'category',
			} );
			expect( result ).toEqual( [
				'category-fruits-yellow',
				'category',
				'archive',
				'index',
			] );
			// Single word taxonomy.
			result = getTemplateHierarchy( 'taxonomy-books-action', {
				templatePrefix: 'taxonomy-books',
			} );
			expect( result ).toEqual( [
				'taxonomy-books-action',
				'taxonomy-books',
				'taxonomy',
				'archive',
				'index',
			] );
			result = getTemplateHierarchy( 'taxonomy-books-action-adventure', {
				templatePrefix: 'taxonomy-books',
			} );
			expect( result ).toEqual( [
				'taxonomy-books-action-adventure',
				'taxonomy-books',
				'taxonomy',
				'archive',
				'index',
			] );
			// Multi word taxonomy/terms.
			result = getTemplateHierarchy(
				'taxonomy-greek-books-action-adventure',
				{
					templatePrefix: 'taxonomy-greek-books',
				}
			);
			expect( result ).toEqual( [
				'taxonomy-greek-books-action-adventure',
				'taxonomy-greek-books',
				'taxonomy',
				'archive',
				'index',
			] );
		} );
		it( 'post types', () => {
			let result = getTemplateHierarchy( 'single-book', {
				templatePrefix: 'single-book',
			} );
			expect( result ).toEqual( [
				'single-book',
				'single',
				'singular',
				'index',
			] );
			result = getTemplateHierarchy( 'single-art-project', {
				templatePrefix: 'single-art-project',
			} );
			expect( result ).toEqual( [
				'single-art-project',
				'single',
				'singular',
				'index',
			] );
			result = getTemplateHierarchy( 'single-art-project-imagine', {
				templatePrefix: 'single-art-project',
			} );
			expect( result ).toEqual( [
				'single-art-project-imagine',
				'single-art-project',
				'single',
				'singular',
				'index',
			] );
			result = getTemplateHierarchy( 'page-hi', {
				templatePrefix: 'page',
			} );
			expect( result ).toEqual( [
				'page-hi',
				'page',
				'singular',
				'index',
			] );
		} );
		it( 'authors', () => {
			const result = getTemplateHierarchy( 'author-rigas', {
				templatePrefix: 'author',
			} );
			expect( result ).toEqual( [
				'author-rigas',
				'author',
				'archive',
				'index',
			] );
		} );
	} );
} );
