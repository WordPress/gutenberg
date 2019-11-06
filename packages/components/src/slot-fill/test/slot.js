/**
 * External dependencies
 */
import { isEmpty } from 'lodash';
import { unmountComponentAtNode, render } from 'react-dom';
import { act } from 'react-dom/test-utils';
import ReactTestRenderer from 'react-test-renderer';

/**
 * Internal dependencies
 */
import Slot from '../slot';
import Fill from '../fill';
import Provider from '../context';

/**
 * WordPress dependencies
 */
import { Component, useState } from '@wordpress/element';

class Filler extends Component {
	constructor() {
		super( ...arguments );

		this.state = {
			num: 1,
		};
	}
	render() {
		return [
			<button key="1" type="button" onClick={ () => this.setState( { num: this.state.num + 1 } ) } />,
			<Fill name={ this.props.name } key="2">{ this.props.text || this.state.num.toString() }</Fill>,
		];
	}
}

describe( 'Slot', () => {
	it( 'should render empty Fills', () => {
		const tree = ReactTestRenderer.create(
			<Provider>
				<div>
					<Slot name="chicken" />
				</div>
				<Fill name="chicken" />
			</Provider>
		).toJSON();

		expect( tree ).toMatchSnapshot();
	} );

	it( 'should render a string Fill', () => {
		const tree = ReactTestRenderer.create(
			<Provider>
				<div>
					<Slot name="chicken" />
				</div>
				<Fill name="chicken">
					content
				</Fill>
			</Provider>
		).toJSON();

		expect( tree ).toMatchSnapshot();
	} );

	it( 'should render a Fill containing an element', () => {
		const tree = ReactTestRenderer.create(
			<Provider>
				<div>
					<Slot name="chicken" />
				</div>
				<Fill name="chicken">
					<span />
				</Fill>
			</Provider>
		).toJSON();

		expect( tree ).toMatchSnapshot();
	} );

	it( 'should render a Fill containing an array', () => {
		const tree = ReactTestRenderer.create(
			<Provider>
				<div>
					<Slot name="chicken" />
				</div>
				<Fill name="chicken">
					{ [ <span key="1" />, <div key="2" />, 'text' ] }
				</Fill>
			</Provider>
		).toJSON();

		expect( tree ).toMatchSnapshot();
	} );

	it( 'calls the functions passed as the Slot’s fillProps in the Fill', () => {
		const onClose = jest.fn();

		const testInstance = ReactTestRenderer.create(
			<Provider>
				<Slot name="chicken" fillProps={ { onClose } } />
				<Fill name="chicken">
					{ ( props ) => {
						return (
							<button onClick={ props.onClose }>Click me</button>
						);
					} }
				</Fill>
			</Provider>
		).root;

		testInstance.findByType( 'button' ).props.onClick();

		expect( onClose ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'should render empty Fills without HTML wrapper when render props used', () => {
		const tree = ReactTestRenderer.create(
			<Provider>
				<div>
					<Slot name="chicken">
						{ ( fills ) => ( ! isEmpty( fills ) && (
							<blockquote>
								{ fills }
							</blockquote>
						) ) }
					</Slot>
				</div>
				<Fill name="chicken" />
			</Provider>
		).toJSON();

		expect( tree ).toMatchSnapshot();
	} );

	it( 'should render a string Fill with HTML wrapper when render props used', () => {
		const tree = ReactTestRenderer.create(
			<Provider>
				<div>
					<Slot name="chicken">
						{ ( fills ) => ( fills && (
							<blockquote>
								{ fills }
							</blockquote>
						) ) }
					</Slot>
				</div>
				<Fill name="chicken">
					content
				</Fill>
			</Provider>
		).toJSON();

		expect( tree ).toMatchSnapshot();
	} );

	it( 'should re-render Slot when not bubbling virtually', () => {
		const testRenderer = ReactTestRenderer.create(
			<Provider>
				<div>
					<Slot name="egg" />
				</div>
				<Filler name="egg" />
			</Provider>
		);

		expect( testRenderer.toJSON() ).toMatchSnapshot();

		testRenderer.root.findByType( 'button' ).props.onClick();

		expect( testRenderer.toJSON() ).toMatchSnapshot();
	} );

	it( 'should render in expected order', () => {
		const testRenderer = ReactTestRenderer.create(
			<Provider>
				<div key="slot">
					<Slot name="egg" />
				</div>
			</Provider>
		);

		testRenderer.update(
			<Provider>
				<div key="slot">
					<Slot name="egg" />
				</div>
				<Filler name="egg" key="first" text="first" />
				<Filler name="egg" key="second" text="second" />
			</Provider>
		);

		testRenderer.update(
			<Provider>
				<div key="slot">
					<Slot name="egg" />
				</div>
				<Filler name="egg" key="second" text="second" />
			</Provider>
		);

		testRenderer.update(
			<Provider>
				<div key="slot">
					<Slot name="egg" />
				</div>
				<Filler name="egg" key="first" text="first" />
				<Filler name="egg" key="second" text="second" />
			</Provider>
		);

		expect( testRenderer.toJSON() ).toMatchSnapshot();
	} );

	describe.each( [ false, true ] )(
		'bubblesVirtually %p',
		( bubblesVirtually ) => {
			it( 'should subsume another slot by the same name', () => {
				const testRenderer = ReactTestRenderer.create(
					<Provider>
						<div data-position="first">
							<Slot name="egg" bubblesVirtually={ bubblesVirtually } />
						</div>
						<div data-position="second"></div>
						<Fill name="egg">Content</Fill>
					</Provider>
				);

				testRenderer.update(
					<Provider>
						<div data-position="first">
							<Slot name="egg" bubblesVirtually={ bubblesVirtually } />
						</div>
						<div data-position="second">
							<Slot name="egg" bubblesVirtually={ bubblesVirtually } />
						</div>
						<Fill name="egg">Content</Fill>
					</Provider>
				);

				expect( testRenderer.toJSON() ).toMatchSnapshot();

				testRenderer.update(
					<Provider>
						<div data-position="first"></div>
						<div data-position="second">
							<Slot name="egg" bubblesVirtually={ bubblesVirtually } />
						</div>
						<Fill name="egg">Content</Fill>
					</Provider>
				);

				expect( testRenderer.toJSON() ).toMatchSnapshot();

				expect( testRenderer.getInstance().slots ).toHaveProperty( 'egg' );
			} );

			it( 'should re-render Fill when fillProps are updated', () => {
				// react-test-renderer doesn't support portal
				const container = document.createElement( 'div' );
				document.body.appendChild( container );

				// Creating a separate component so only this one will be re-rendered
				// when its internal state (children) changes. App will not.
				// This is necessary so we can ensure that Fill components will re-render
				// when fillProps change even when they're in a separate tree.
				const StatefulSlot = () => {
					const [ children, setChildren ] = useState( 'a' );
					return (
						<>
							<button data-testid="change" onClick={ () => setChildren( 'b' ) }>
								Change
							</button>
							<Slot
								name="chicken"
								bubblesVirtually={ bubblesVirtually }
								fillProps={ { children } }
							/>
						</>
					);
				};

				const App = () => (
					<Provider>
						<StatefulSlot />
						<Fill name="chicken">
							{ ( props ) => <div data-testid="fill">{ props.children }</div> }
						</Fill>
					</Provider>
				);

				act( () => {
					render( <App />, container );
				} );

				const fill = container.querySelector( '[data-testid="fill"]' );
				const button = container.querySelector( '[data-testid="change"]' );

				expect( fill.innerHTML ).toBe( 'a' );

				button.click();

				expect( fill.innerHTML ).toBe( 'b' );

				unmountComponentAtNode( container );
				container.remove();
			} );
		}
	);
} );
