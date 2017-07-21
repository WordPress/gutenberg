/**
 * Internal dependencies
 */
import { createEndpointTag } from '../';

describe( 'createEndpointTag', () => {
	const expected = { base: {}, nested: {} };
	const schema = {
		routes: {
			'/wp/v2/pages/(?P<parent>[\\d]+)/revisions': expected.base,
			'/wp/v2/pages/(?P<parent>[\\d]+)/revisions/(?P<id>[\d]+)': expected.nested,
		},
	};

	it( 'should match base route with balanced match pattern', () => {
		const endpoint = createEndpointTag( schema );
		const match = endpoint`/wp/v2/pages/${ 1 }/revisions`;

		expect( match[ 0 ] ).toBe( '/wp/v2/pages/1/revisions' );
		expect( match[ 1 ] ).toBe( expected.base );
	} );

	it( 'should match base route with simple fragments', () => {
		const endpoint = createEndpointTag( schema );
		const match = endpoint`/wp/v2/${ 'pages' }/${ 1 }/revisions`;

		expect( match[ 0 ] ).toBe( '/wp/v2/pages/1/revisions' );
		expect( match[ 1 ] ).toBe( expected.base );
	} );

	it( 'should ignore undefined arguments', () => {
		const endpoint = createEndpointTag( schema );
		const match = endpoint`/wp/v2/pages/${ undefined }/revisions`;

		expect( match ).toBeUndefined();
	} );

	it( 'should ignore null arguments', () => {
		const endpoint = createEndpointTag( schema );
		const match = endpoint`/wp/v2/pages/${ null }/revisions`;

		expect( match ).toBeUndefined();
	} );

	it( 'should match nested route with balanced match pattern', () => {
		const endpoint = createEndpointTag( schema );
		const match = endpoint`/wp/v2/pages/${ 1 }/revisions/${ 2 }`;

		expect( match[ 0 ] ).toBe( '/wp/v2/pages/1/revisions/2' );
		expect( match[ 1 ] ).toBe( expected.nested );
	} );

	it( 'should match nested route with simple fragments', () => {
		const endpoint = createEndpointTag( schema );
		const match = endpoint`/wp/v2/${ 'pages' }/${ 1 }/revisions/${ 2 }`;

		expect( match[ 0 ] ).toBe( '/wp/v2/pages/1/revisions/2' );
		expect( match[ 1 ] ).toBe( expected.nested );
	} );
} );
