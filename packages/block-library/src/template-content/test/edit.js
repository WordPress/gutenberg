/**
 * Internal dependencies
 */
import { selectWrapModeClientIds } from '../select-wrap-mode-client-ids';

/**
 * Builds a fake `select( blockEditorStore )` from a flat tree map. The map
 * keys are container client ids (use `''` for the canvas root), values are
 * the children's client ids.
 *
 * @param {Record<string, string[]>} order Block-order map.
 */
function makeSelectors( order ) {
	// Walk children → parents lookup.
	const parents = new Map();
	for ( const [ container, children ] of Object.entries( order ) ) {
		for ( const child of children ) {
			parents.set( child, container );
		}
	}
	const ancestorsOf = ( id ) => {
		const out = [];
		let p = parents.get( id );
		while ( p !== undefined && p !== '' ) {
			out.unshift( p );
			p = parents.get( p );
		}
		return out;
	};
	const descendantsOf = ( ids ) => {
		const out = [];
		const walk = ( id ) => {
			for ( const child of order[ id ] ?? [] ) {
				out.push( child );
				walk( child );
			}
		};
		ids.forEach( walk );
		return out;
	};
	return {
		getBlockOrder: ( id = '' ) => order[ id ] ?? [],
		getBlockParents: ancestorsOf,
		getClientIdsOfDescendants: descendantsOf,
	};
}

describe( 'selectWrapModeClientIds', () => {
	test( 'classifies blocks correctly when template-content is nested', () => {
		// Mirrors TT5's root.html shape:
		//
		//   root
		//   ├── group (ancestor of TC)
		//   │   ├── header  (chrome top)
		//   │   │   └── header-title  (chrome descendant)
		//   │   ├── tc  (template-content)
		//   │   │   └── inner-para  (inner child)
		//   │   └── footer  (chrome top)
		//   │       └── footer-para  (chrome descendant)
		//   └── root-para  (chrome top)
		const selectors = makeSelectors( {
			'': [ 'group', 'root-para' ],
			group: [ 'header', 'tc', 'footer' ],
			header: [ 'header-title' ],
			tc: [ 'inner-para' ],
			footer: [ 'footer-para' ],
		} );

		const result = selectWrapModeClientIds( selectors, 'tc' );

		expect( result.ancestorClientIds ).toEqual( [ 'group' ] );
		expect( result.innerChildClientIds ).toEqual( [ 'inner-para' ] );
		expect( new Set( result.chromeTopClientIds ) ).toEqual(
			new Set( [ 'root-para', 'header', 'footer' ] )
		);
		expect( new Set( result.chromeDescendantClientIds ) ).toEqual(
			new Set( [ 'header-title', 'footer-para' ] )
		);
		// template-content itself must NOT appear in any chrome bucket; the
		// caller sets its mode separately, and lumping it in with chrome
		// previously caused descendants to clobber template-content's mode.
		expect( result.chromeTopClientIds ).not.toContain( 'tc' );
		expect( result.chromeDescendantClientIds ).not.toContain( 'tc' );
		expect( result.chromeDescendantClientIds ).not.toContain(
			'inner-para'
		);
	} );

	test( 'handles a flat tree with template-content at the canvas root', () => {
		const selectors = makeSelectors( {
			'': [ 'header', 'tc', 'footer' ],
			tc: [ 'inner-para' ],
		} );

		const result = selectWrapModeClientIds( selectors, 'tc' );

		expect( result.ancestorClientIds ).toEqual( [] );
		expect( result.innerChildClientIds ).toEqual( [ 'inner-para' ] );
		expect( new Set( result.chromeTopClientIds ) ).toEqual(
			new Set( [ 'header', 'footer' ] )
		);
		expect( result.chromeDescendantClientIds ).toEqual( [] );
	} );

	test( 'returns empty buckets when clientId is missing', () => {
		const selectors = makeSelectors( {} );

		const result = selectWrapModeClientIds( selectors, null );

		expect( result ).toEqual( {
			ancestorClientIds: [],
			innerChildClientIds: [],
			chromeTopClientIds: [],
			chromeDescendantClientIds: [],
		} );
	} );
} );
