/**
 * Internal dependencies
 */
import traverse from '../traverse';

describe( 'CSS traverse', () => {
	it( 'Should traverse the CSS', () => {
		const input = `h1 { color: red; }`;
		const output = traverse( input, ( node ) => {
			if ( node.type === 'rule' ) {
				return {
					...node,
					selectors: node.selectors.map(
						( selector ) => 'namespace ' + selector
					),
				};
			}

			return node;
		} );

		expect( output ).toMatchSnapshot();
	} );
} );
