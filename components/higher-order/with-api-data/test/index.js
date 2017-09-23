/**
 * External dependencies
 */
import { shallow } from 'enzyme';
import { identity, fromPairs } from 'lodash';

/**
 * Internal dependencies
 */
import withAPIData from '../';

jest.mock( '../request', () => jest.fn( () => Promise.resolve( {
	body: {},
} ) ) );

describe( 'withAPIData()', () => {
	const schema = {
		routes: {
			'/wp/v2/pages/(?P<parent>[\\d]+)/revisions': {
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

	it( 'should ignore unmatched resources', () => {
		const wrapper = getWrapper( () => ( {
			revision: '/wp/v2/pages/5/revisions/10',
		} ) );

		expect( wrapper.state( 'dataProps' ) ).toEqual( {} );
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
