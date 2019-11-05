/**
 * External dependencies
 */
import { isEmpty } from 'lodash';
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
import { Component } from '@wordpress/element';

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
		}
	);
} );
