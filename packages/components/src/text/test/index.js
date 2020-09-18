/**
 * External dependencies
 */
import { render, unmountComponentAtNode } from 'react-dom';
import { act } from 'react-dom/test-utils';

/**
 * Internal dependencies
 */
import Text from '../';

let container = null;

beforeEach( () => {
	container = document.createElement( 'div' );
	document.body.appendChild( container );
} );

afterEach( () => {
	unmountComponentAtNode( container );
	container.remove();
	container = null;
} );

function getTextStyle( node ) {
	const text = node || container.children[ 0 ];
	return window.getComputedStyle( text );
}

describe( 'Text', () => {
	describe( 'Basic rendering', () => {
		it( 'should render', () => {
			act( () => {
				render( <Text>Hello</Text>, container );
			} );

			const [ text ] = container.children;

			expect( text.innerHTML ).toBe( 'Hello' );
		} );

		it( 'should render as a <p>, by default', () => {
			act( () => {
				render( <Text />, container );
			} );

			const [ text ] = container.children;

			expect( text.tagName ).toBe( 'P' );
		} );

		it( 'should render as another selector, if specified', () => {
			act( () => {
				render(
					<>
						<Text as="h1" />
						<Text as="h2" />
						<Text as="span" />
						<Text as="div" />
					</>,
					container
				);
			} );

			const [ h1, h2, span, div ] = container.children;

			expect( h1.tagName ).toBe( 'H1' );
			expect( h2.tagName ).toBe( 'H2' );
			expect( span.tagName ).toBe( 'SPAN' );
			expect( div.tagName ).toBe( 'DIV' );
		} );
	} );

	describe( 'Variants', () => {
		it( 'should render with specified variantion styles', () => {
			act( () => {
				render(
					<>
						<Text>Base</Text>
						<Text variant="title.large">Title Large</Text>
						<Text variant="caption">Caption</Text>
					</>,
					container
				);
			} );

			const [ base, title, caption ] = container.children;

			expect( getTextStyle( base ).fontSize ).toBeFalsy();
			expect( getTextStyle( title ).fontSize ).toBe( '32px' );
			expect( getTextStyle( caption ).fontSize ).toBe( '12px' );
		} );
	} );
} );
