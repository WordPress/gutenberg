/**
 * Internal dependencies
 */
import { terms } from './fixtures';
import {
	getEntitiesInfo,
	getValueFromObjectPath,
	getQueryContext,
} from '../utils';

describe( 'Query block utils', () => {
	describe( 'getEntitiesInfo', () => {
		it( 'should return an empty object when no terms provided', () => {
			expect( getEntitiesInfo() ).toEqual( {
				terms: undefined,
			} );
		} );
		it( 'should return proper terms info object', () => {
			expect( getEntitiesInfo( terms ) ).toEqual(
				expect.objectContaining( {
					mapById: expect.objectContaining( {
						4: expect.objectContaining( { name: 'nba' } ),
						11: expect.objectContaining( {
							name: 'featured',
						} ),
					} ),
					mapByName: expect.objectContaining( {
						nba: expect.objectContaining( { id: 4 } ),
						featured: expect.objectContaining( { id: 11 } ),
					} ),
					names: expect.arrayContaining( [ 'nba', 'featured' ] ),
				} )
			);
		} );
	} );

	describe( 'getValueFromObjectPath', () => {
		it( 'should return undefined when path is empty', () => {
			const object = { foo: 'bar' };
			const result = getValueFromObjectPath( object, '' );
			expect( result ).toBeUndefined();
		} );

		it( 'should return undefined when path does not exist', () => {
			const object = { foo: 'bar' };
			const result = getValueFromObjectPath( object, 'baz' );
			expect( result ).toBeUndefined();
		} );

		it( 'should return undefined when a deeper path does not exist', () => {
			const object = { foo: { bar: 'baz' } };
			const result = getValueFromObjectPath( object, 'foo.test' );
			expect( result ).toBeUndefined();
		} );

		it( 'should return the corresponding value of a single level path', () => {
			const object = { foo: 'bar' };
			const result = getValueFromObjectPath( object, 'foo' );
			expect( result ).toBe( 'bar' );
		} );

		it( 'should return the value of a deeper path', () => {
			const object = { foo: { bar: { baz: 'test' } } };
			const result = getValueFromObjectPath( object, 'foo.bar.baz' );
			expect( result ).toBe( 'test' );
		} );
	} );

	describe( 'getQueryContext', () => {
		it( 'should return the correct query context based on template slug and available post types', () => {
			expect( getQueryContext( '404', undefined ) ).toStrictEqual( {
				isSingular: true,
				templateType: '404',
				postType: '',
			} );
			expect( getQueryContext( 'blank', undefined ) ).toStrictEqual( {
				isSingular: true,
				templateType: 'blank',
				postType: '',
			} );
			expect( getQueryContext( 'single', 'post' ) ).toStrictEqual( {
				isSingular: true,
				templateType: 'single',
				postType: 'post',
			} );
			expect( getQueryContext( 'single-film', undefined ) ).toStrictEqual(
				{
					isSingular: true,
					templateType: 'single',
					postType: 'film',
				}
			);
			expect( getQueryContext( 'page', 'page' ) ).toStrictEqual( {
				isSingular: true,
				templateType: 'page',
				postType: 'page',
			} );
			expect( getQueryContext( 'wp', undefined ) ).toStrictEqual( {
				isSingular: true,
				templateType: 'custom',
				postType: '',
			} );
			expect( getQueryContext( 'category', undefined ) ).toStrictEqual( {
				isSingular: false,
				templateType: 'category',
				postType: '',
			} );
			expect(
				getQueryContext( 'category-dog', undefined )
			).toStrictEqual( {
				isSingular: false,
				templateType: 'category',
				postType: 'dog',
			} );
			expect( getQueryContext( 'archive', undefined ) ).toStrictEqual( {
				isSingular: false,
				templateType: 'archive',
				postType: '',
			} );
			expect(
				getQueryContext( 'archive-film', undefined )
			).toStrictEqual( {
				isSingular: false,
				templateType: 'archive',
				postType: 'film',
			} );
		} );
	} );
} );
