/**
 * Internal dependencies
 */
import traverse from '../traverse';
import parse from '../ast/parse';

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

describe( 'CSS parse', () => {
	it( 'Should handle closing parenthesis within url', () => {
		const input = `.a { b: url(")"); d: url(";a"); }`;
		const output = parse( input );

		expect( output ).toMatchSnapshot();
	} );

	it( 'Should handle urls without quotes', () => {
		const input = `.a {
			background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAEBAMAAABb34NNAAAAFVBMVEXyrmHqcBDtdQ3pcRHcbRkAAAD/uSmYi/+cAAAABnRSTlORbFE2DwAwkbURAAAAEUlEQVQI12MIEmEwSwAiIAMAC/AB+fq6WIgAAAAASUVORK5CYII=);
			background-repeat: no-repeat
		}`;
		const output = parse( input );

		expect( output ).toMatchSnapshot();
	} );
} );
