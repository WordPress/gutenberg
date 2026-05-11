/**
 * Internal dependencies
 */
import { terms } from './fixtures';
import {
	getEntitiesInfo,
	getValueFromObjectPath,
	getQueryContextFromTemplate,
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

	describe( 'getQueryContextFromTemplate', () => {
		it( 'should return the correct query context based on template slug', () => {
			expect( getQueryContextFromTemplate() ).toStrictEqual( {
				isSingular: true,
			} );
			expect( getQueryContextFromTemplate( '404' ) ).toStrictEqual( {
				isSingular: true,
				templateType: '404',
			} );
			expect( getQueryContextFromTemplate( 'blank' ) ).toStrictEqual( {
				isSingular: true,
				templateType: 'blank',
			} );
			expect( getQueryContextFromTemplate( 'single' ) ).toStrictEqual( {
				isSingular: true,
				templateType: 'single',
			} );
			expect(
				getQueryContextFromTemplate( 'single-film' )
			).toStrictEqual( {
				isSingular: true,
				templateType: 'single',
			} );
			expect( getQueryContextFromTemplate( 'page' ) ).toStrictEqual( {
				isSingular: true,
				templateType: 'page',
			} );
			expect( getQueryContextFromTemplate( 'wp' ) ).toStrictEqual( {
				isSingular: true,
				templateType: 'custom',
			} );
			expect( getQueryContextFromTemplate( 'category' ) ).toStrictEqual( {
				isSingular: false,
				templateType: 'category',
			} );
			expect(
				getQueryContextFromTemplate( 'category-dog' )
			).toStrictEqual( {
				isSingular: false,
				templateType: 'category',
			} );
			expect( getQueryContextFromTemplate( 'archive' ) ).toStrictEqual( {
				isSingular: false,
				templateType: 'archive',
			} );
			expect(
				getQueryContextFromTemplate( 'archive-film' )
			).toStrictEqual( {
				isSingular: false,
				templateType: 'archive',
			} );
		} );
	} );
} );
