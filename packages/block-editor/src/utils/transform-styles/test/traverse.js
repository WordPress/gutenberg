/**
 * External dependencies
 */
import * as CSSwhat from 'css-what';

/**
 * Internal dependencies
 */
import traverse from '../traverse';

describe( 'CSS traverse', () => {
	it( 'Should traverse the CSS', () => {
		const input = `h1 { color: red; }`;
		const output = traverse( input, ( node ) => {
			// eslint-disable-next-line no-undef
			if ( node instanceof CSSStyleRule ) {
				const cssSelectorsAst = CSSwhat.parse( node.selectorText );
				cssSelectorsAst[ 0 ] = [
					{
						type: 'tag',
						name: 'namespace',
						namespace: null,
					},
					{
						type: 'descendant',
					},
				].concat( cssSelectorsAst[ 0 ] );
				node.selectorText = CSSwhat.stringify( cssSelectorsAst );
			}
			return node;
		} );

		expect( output ).toMatchSnapshot();
	} );
} );
