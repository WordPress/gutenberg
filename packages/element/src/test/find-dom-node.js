import { act, render } from '@testing-library/react';
import { Component } from '..';
import findDOMNodePolyfill from '../find-dom-node';

describe( 'findDOMNode', () => {
	it( 'should return null when passed null', () => {
		expect( findDOMNodePolyfill( null ) ).toBeNull();
		expect( console ).toHaveWarned();
	} );

	it( 'should return the element when passed a DOM element', () => {
		const div = document.createElement( 'div' );
		expect( findDOMNodePolyfill( div ) ).toBe( div );
	} );

	it( 'should track the current DOM node across re-renders', () => {
		class Toggle extends Component {
			constructor( props ) {
				super( props );
				this.state = { count: 0 };
				this.results = [];
			}

			componentDidMount() {
				this.recordNode();
			}

			componentDidUpdate() {
				this.recordNode();
			}

			recordNode() {
				const node = findDOMNodePolyfill( this );
				this.results.push( node.tagName );
			}

			render() {
				return this.state.count % 2 === 0 ? (
					<div>even</div>
				) : (
					<span>odd</span>
				);
			}
		}

		let toggleRef;
		render( <Toggle ref={ ( ref ) => ( toggleRef = ref ) } /> );
		act( () => toggleRef.setState( { count: 1 } ) );
		act( () => toggleRef.setState( { count: 2 } ) );
		act( () => toggleRef.setState( { count: 3 } ) );

		expect( toggleRef.results ).toEqual( [ 'DIV', 'SPAN', 'DIV', 'SPAN' ] );
	} );

	it( 'should return null for an unmounted component', () => {
		class MyComponent extends Component {
			render() {
				return <div>hello</div>;
			}
		}

		let instanceRef;
		const { rerender } = render(
			<MyComponent
				ref={ ( ref ) => {
					instanceRef = ref;
					return () => {};
				} }
			/>
		);

		expect( findDOMNodePolyfill( instanceRef ) ).toBeInstanceOf(
			window.HTMLDivElement
		);

		rerender( <p>replaced</p> );

		expect( instanceRef ).not.toBeNull();
		expect( findDOMNodePolyfill( instanceRef ) ).toBeNull();
	} );

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
	} );
} );
