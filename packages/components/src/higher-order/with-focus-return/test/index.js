/**
 * External dependencies
 */
import renderer from 'react-test-renderer';
import { mount } from 'enzyme';

/**
 * WordPress dependencies
 */
import { Component, createElement } from '@wordpress/element';

/**
 * Internal dependencies
 */
import withFocusReturn, { Provider } from '../';

class Test extends Component {
	render() {
		return (
			<div className="test">
				<textarea />
			</div>
		);
	}
}

describe( 'withFocusReturn()', () => {
	describe( 'testing rendering and focus handling', () => {
		const Composite = withFocusReturn( Test );
		const activeElement = document.createElement( 'button' );
		const switchFocusTo = document.createElement( 'input' );

		const getInstance = ( wrapper ) => {
			return wrapper.root.find(
				( node ) => node.instance instanceof Component
			).instance;
		};

		beforeEach( () => {
			activeElement.focus();
		} );

		afterEach( () => {
			activeElement.blur();
		} );

		it( 'should render a basic Test component inside the HOC', () => {
			const renderedComposite = renderer.create( <Composite /> );
			const wrappedElement = renderedComposite.root.findByType( Test );
			const wrappedElementShallow = wrappedElement.children[ 0 ];
			expect( wrappedElementShallow.props.className ).toBe( 'test' );
			expect( wrappedElementShallow.type ).toBe( 'div' );
			expect( wrappedElementShallow.children[ 0 ].type ).toBe(
				'textarea'
			);
		} );

		it( 'should pass own props through to the wrapped element', () => {
			const renderedComposite = renderer.create(
				<Composite test="test" />
			);
			const wrappedElement = renderedComposite.root.findByType( Test );
			// Ensure that the wrapped Test element has the appropriate props.
			expect( wrappedElement.props.test ).toBe( 'test' );
		} );

		it( 'should not pass any withFocusReturn context props through to the wrapped element', () => {
			const renderedComposite = renderer.create(
				<Composite test="test" />
			);
			const wrappedElement = renderedComposite.root.findByType( Test );
			// Ensure that the wrapped Test element has the appropriate props.
			expect( wrappedElement.props.focusHistory ).toBeUndefined();
		} );

		it( 'should not switch focus back to the bound focus element', () => {
			const mountedComposite = renderer.create( <Composite /> );

			expect( getInstance( mountedComposite ).activeElementOnMount ).toBe(
				activeElement
			);

			// Change activeElement.
			switchFocusTo.focus();
			expect( document.activeElement ).toBe( switchFocusTo );

			// Should keep focus on switchFocusTo, because it is not within HOC.
			mountedComposite.unmount();
			expect( document.activeElement ).toBe( switchFocusTo );
		} );

		it( 'should switch focus back when unmounted while having focus', () => {
			const wrapper = mount( <Composite /> );
			wrapper
				.find( 'textarea' )
				.at( 0 )
				.simulate( 'focus' );

			// Should return to the activeElement saved with this component.
			wrapper.unmount();
			expect( document.activeElement ).toBe( activeElement );
		} );

		it( 'should switch focus to the most recent still-available focus target', () => {
			const container = document.createElement( 'div' );
			document.body.appendChild( container );
			const wrapper = mount(
				createElement(
					( props ) => (
						<Provider>
							<input name="first" />
							{ props.renderSecondInput && (
								<input name="second" />
							) }
							{ props.renderComposite && <Composite /> }
						</Provider>
					),
					{ renderSecondInput: true }
				),
				{ attachTo: container }
			);

			function focus( selector ) {
				const childWrapper = wrapper.find( selector );
				const childNode = childWrapper.getDOMNode();
				childWrapper.simulate( 'focus', { target: childNode } );
			}

			focus( 'input[name="first"]' );
			jest.spyOn(
				wrapper.find( 'input[name="first"]' ).getDOMNode(),
				'focus'
			);
			focus( 'input[name="second"]' );
			wrapper.setProps( { renderComposite: true } );
			focus( 'textarea' );
			wrapper.setProps( { renderSecondInput: false } );
			wrapper.setProps( { renderComposite: false } );

			expect(
				wrapper.find( 'input[name="first"]' ).getDOMNode().focus
			).toHaveBeenCalled();
		} );
	} );
} );
