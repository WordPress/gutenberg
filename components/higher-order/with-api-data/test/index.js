/**
 * External dependencies
 */
import { shallow } from 'enzyme';
import { identity, fromPairs } from 'lodash';

/**
 * Internal dependencies
 */
import withAPIData from '../';

jest.mock( '../request', () => {
	const request = jest.fn( ( { path } ) => {
		if ( /\/users$/.test( path ) ) {
			return Promise.reject( {
				code: 'rest_forbidden_context',
				message: 'Sorry, you are not allowed to list users.',
				data: { status: 403 },
			} );
		}

		return Promise.resolve( { body: {} } );
	} );

	request.getCachedResponse = ( { method, path } ) => {
		return method === 'GET' && '/wp/v2/pages/10' === path ?
			{ body: { title: 'OK!' }, headers: [] } :
			undefined;
	};

	return request;
} );

describe( 'withAPIData()', () => {
	const schema = {
		routes: {
			'/wp/v2/pages/(?P<parent>[\\d]+)/revisions': {
				methods: [ 'GET' ],
			},
			'/wp/v2/users': {
				methods: [ 'GET' ],
			},
			'/wp/v2/pages/(?P<id>[\\d]+)': {
				methods: [
					'GET',
					'POST',
					'PUT',
					'PATCH',
					'DELETE',
				],
			},
		},
	};

	function getWrapper( mapPropsToData, props ) {
		if ( ! mapPropsToData ) {
			mapPropsToData = () => ( {
				revisions: '/wp/v2/pages/5/revisions',
			} );
		}

		const Component = withAPIData( mapPropsToData )( () => '' );

		return shallow( <Component { ...props } />, {
			lifecycleExperimental: true,
			context: {
				getAPISchema: () => schema,
				getAPIPostTypeRestBaseMapping: identity,
				getAPITaxonomyRestBaseMapping: identity,
			},
		} );
	}

	it( 'should initialize fetchables on mount', ( done ) => {
		const wrapper = getWrapper();

		const dataProps = wrapper.state( 'dataProps' );
		expect( Object.keys( dataProps ) ).toEqual( [ 'revisions' ] );
		expect( Object.keys( dataProps.revisions ) ).toEqual( [
			'get',
			'isLoading',
			'path',
		] );
		expect( dataProps.revisions.isLoading ).toBe( true );

		process.nextTick( () => {
			expect( wrapper.state( 'dataProps' ).revisions.isLoading ).toBe( false );
			expect( wrapper.state( 'dataProps' ).revisions.data ).toEqual( {} );

			done();
		} );
	} );

	it( 'should handle error response', ( done ) => {
		const wrapper = getWrapper( () => ( {
			users: '/wp/v2/users',
		} ) );

		process.nextTick( () => {
			expect( wrapper.state( 'dataProps' ).users.isLoading ).toBe( false );
			expect( wrapper.state( 'dataProps' ).users ).not.toHaveProperty( 'data' );
			expect( wrapper.state( 'dataProps' ).users.error.code ).toBe( 'rest_forbidden_context' );

			done();
		} );
	} );

	it( 'should preassign cached data', ( done ) => {
		const wrapper = getWrapper( () => ( {
			page: '/wp/v2/pages/10',
		} ) );

		const dataProps = wrapper.state( 'dataProps' );
		expect( Object.keys( dataProps ) ).toEqual( [ 'page' ] );
		expect( Object.keys( dataProps.page ) ).toEqual( expect.arrayContaining( [
			'get',
			'isLoading',
			'path',
			'data',
		] ) );
		expect( dataProps.page.isLoading ).toBe( false );
		expect( wrapper.state( 'dataProps' ).page.data ).toEqual( { title: 'OK!' } );

		process.nextTick( () => {
			expect( wrapper.state( 'dataProps' ).page.isLoading ).toBe( false );

			done();
		} );
	} );

	it( 'should assign an empty prop object for unmatched resources', () => {
		const wrapper = getWrapper( () => ( {
			unknown: '/wp/v2/unknown/route',
		} ) );

		const dataProps = wrapper.state( 'dataProps' );
		expect( Object.keys( dataProps ) ).toEqual( [ 'unknown' ] );
		expect( Object.keys( dataProps.unknown ) ).toEqual( [] );
		expect( wrapper.prop( 'unknown' ) ).toEqual( {} );
	} );

	it( 'should include full gamut of method available properties', () => {
		const wrapper = getWrapper( () => ( {
			page: '/wp/v2/pages/5',
		} ) );

		const dataProps = wrapper.state( 'dataProps' );
		expect( Object.keys( dataProps ) ).toEqual( [ 'page' ] );
		expect( Object.keys( dataProps.page ) ).toEqual( [
			'get',
			'isLoading',
			'path',
			'create',
			'isCreating',
			'save',
			'isSaving',
			'patch',
			'isPatching',
			'delete',
			'isDeleting',
		] );
		expect( dataProps.page.isLoading ).toBe( true );
		expect( dataProps.page.isCreating ).toBe( false );
		expect( dataProps.page.isSaving ).toBe( false );
		expect( dataProps.page.isPatching ).toBe( false );
		expect( dataProps.page.isDeleting ).toBe( false );
	} );

	it( 'should not clobber existing data when receiving new props', ( done ) => {
		const wrapper = getWrapper(
			( { pages } ) => fromPairs( pages.map( ( page ) => [
				'page' + page,
				'/wp/v2/pages/' + page,
			] ) ),
			{ pages: [ 1 ] }
		);

		process.nextTick( () => {
			wrapper.setProps( { pages: [ 1, 2 ] } );

			const dataProps = wrapper.state( 'dataProps' );
			expect( dataProps.page1.isLoading ).toBe( false );
			expect( dataProps.page1.data ).toEqual( {} );
			expect( dataProps.page2.isLoading ).toBe( true );

			done();
		} );
	} );

	it( 'should remove dropped mappings', ( done ) => {
		const wrapper = getWrapper(
			( { pages } ) => fromPairs( pages.map( ( page ) => [
				'page' + page,
				'/wp/v2/pages/' + page,
			] ) ),
			{ pages: [ 1 ] }
		);

		process.nextTick( () => {
			wrapper.setProps( { pages: [ 2 ] } );

			const dataProps = wrapper.state( 'dataProps' );
			expect( dataProps ).not.toHaveProperty( 'page1' );
			expect( dataProps ).toHaveProperty( 'page2' );

			done();
		} );
	} );

	it( 'should refetch on changed path', ( done ) => {
		const wrapper = getWrapper(
			( { pageId } ) => ( {
				page: `/wp/v2/pages/${ pageId }`,
			} ),
			{ pageId: 5 }
		);

		process.nextTick( () => {
			expect( wrapper.state( 'dataProps' ).page.isLoading ).toBe( false );
			wrapper.setProps( { pageId: 7 } );
			expect( wrapper.state( 'dataProps' ).page.isLoading ).toBe( true );

			done();
		} );
	} );
} );
