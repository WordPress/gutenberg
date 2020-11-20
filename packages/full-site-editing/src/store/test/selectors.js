/**
 * Internal dependencies
 */
import {
	__experimentalGetDefaultTemplateTypes as getDefaultTemplateTypes,
	__experimentalGetDefaultTemplateType as getDefaultTemplateType,
	__experimentalGetTemplateInfo as getTemplateInfo,
} from '../selectors';

const defaultTemplateTypes = [
	{
		title: 'Default (Index)',
		description: 'Main template',
		slug: 'index',
	},
	{
		title: '404 (Not Found)',
		description: 'Applied when content cannot be found',
		slug: '404',
	},
];

describe( 'selectors', () => {
	describe( 'getDefaultTemplateTypes', () => {
		const state = { defaultTemplateTypes };

		it( 'returns undefined if there are no default template types', () => {
			const emptyState = {};
			expect( getDefaultTemplateTypes( emptyState ) ).toBeUndefined();
		} );

		it( 'returns a list of default template types if present in state', () => {
			expect( getDefaultTemplateTypes( state ) ).toHaveLength( 2 );
		} );
	} );

	describe( 'getDefaultTemplateType', () => {
		const state = { defaultTemplateTypes };

		it( 'returns an empty object if there are no default template types', () => {
			const emptyState = {};
			expect( getDefaultTemplateType( emptyState, 'slug' ) ).toEqual(
				{}
			);
		} );

		it( 'returns an empty object if the requested slug is not found', () => {
			expect( getDefaultTemplateType( state, 'foobar' ) ).toEqual( {} );
		} );

		it( 'returns the requested default template type ', () => {
			expect( getDefaultTemplateType( state, 'index' ) ).toEqual( {
				title: 'Default (Index)',
				description: 'Main template',
				slug: 'index',
			} );
		} );

		it( 'returns the requested default template type even when the slug is numeric', () => {
			expect( getDefaultTemplateType( state, '404' ) ).toEqual( {
				title: '404 (Not Found)',
				description: 'Applied when content cannot be found',
				slug: '404',
			} );
		} );
	} );

	describe( 'getTemplateInfo', () => {
		const state = { defaultTemplateTypes };

		it( 'should return an empty object if no template is passed', () => {
			expect( getTemplateInfo( state, null ) ).toEqual( {} );
			expect( getTemplateInfo( state, undefined ) ).toEqual( {} );
			expect( getTemplateInfo( state, false ) ).toEqual( {} );
		} );

		it( 'should return the default title if none is defined on the template', () => {
			expect( getTemplateInfo( state, { slug: 'index' } ).title ).toEqual(
				'Default (Index)'
			);
		} );

		it( 'should return the rendered title if defined on the template', () => {
			expect(
				getTemplateInfo( state, {
					slug: 'index',
					title: { rendered: 'test title' },
				} ).title
			).toEqual( 'test title' );
		} );

		it( 'should return the slug if no title is found', () => {
			expect(
				getTemplateInfo( state, {
					slug: 'not a real template',
				} ).title
			).toEqual( 'not a real template' );
		} );

		it( 'should return the default description if none is defined on the template', () => {
			expect(
				getTemplateInfo( state, { slug: 'index' } ).description
			).toEqual( 'Main template' );
		} );

		it( 'should return the raw excerpt as description if defined on the template', () => {
			expect(
				getTemplateInfo( state, {
					slug: 'index',
					excerpt: { raw: 'test description' },
				} ).description
			).toEqual( 'test description' );
		} );

		it( 'should return both a title and a description', () => {
			expect( getTemplateInfo( state, { slug: 'index' } ) ).toEqual( {
				title: 'Default (Index)',
				description: 'Main template',
			} );

			expect(
				getTemplateInfo( state, {
					slug: 'index',
					title: { rendered: 'test title' },
				} )
			).toEqual( {
				title: 'test title',
				description: 'Main template',
			} );

			expect(
				getTemplateInfo( state, {
					slug: 'index',
					excerpt: { raw: 'test description' },
				} )
			).toEqual( {
				title: 'Default (Index)',
				description: 'test description',
			} );

			expect(
				getTemplateInfo( state, {
					slug: 'index',
					title: { rendered: 'test title' },
					excerpt: { raw: 'test description' },
				} )
			).toEqual( {
				title: 'test title',
				description: 'test description',
			} );
		} );
	} );
} );
