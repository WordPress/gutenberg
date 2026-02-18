import { render } from '@testing-library/react';
import { Component } from '..';
import findDOMNodePolyfill from '../find-dom-node';

describe( 'findDOMNode', () => {
	it( 'should find DOM node rendered by a nested child component', () => {
		function Empty() {
			return null;
		}

		function Inner() {
			return <span className="inner">hello</span>;
		}

		class Outer extends Component {
			render() {
				return (
					<>
						<Empty />
						<Inner />
					</>
				);
			}
		}

		let outerRef;
		render( <Outer ref={ ( ref ) => ( outerRef = ref ) } /> );

		const node = findDOMNodePolyfill( outerRef );
		expect( node ).toBeInstanceOf( window.HTMLSpanElement );
		expect( node.className ).toBe( 'inner' );
		expect( console ).toHaveWarnedWith(
			'wp.element.findDOMNode is deprecated since version 6.2. Please use DOM refs instead. See: https://react.dev/reference/react-dom/findDOMNode'
		);
	} );
} );
