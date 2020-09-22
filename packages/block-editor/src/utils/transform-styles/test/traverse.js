/**
 * External dependencies
 */
import csstree from 'css-tree';

/**
 * Internal dependencies
 */
import traverse from '../traverse';

describe( 'CSS traverse', () => {
	it( 'Should traverse the CSS', () => {
		const input = `h1 { color: red; }`;

		const WHITESPACE_CSS = csstree.fromPlainObject( {
			type: 'WhiteSpace',
			value: ' ',
		} );
		const NAMESPACE_SELECTOR = csstree.fromPlainObject( {
			type: 'TypeSelector',
			name: 'namespace',
		} );
		const output = traverse( input, ( node ) => {
			if ( node.type === 'Selector' ) {
				const whitespaceCssItem = node.children.createItem(
					WHITESPACE_CSS
				);
				node.children.prepend( whitespaceCssItem );
				const namespaceSelectorItem = node.children.createItem(
					NAMESPACE_SELECTOR
				);
				node.children.prepend( namespaceSelectorItem );
			}
		} );

		expect( output ).toMatchSnapshot();
	} );
} );
