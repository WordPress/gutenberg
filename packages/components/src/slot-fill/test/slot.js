/**
 * External dependencies
 */
import { mount } from 'enzyme';
import { isEmpty } from 'lodash';
import ReactTestRenderer from 'react-test-renderer';

/**
 * Internal dependencies
 */
import Slot from '../slot';
import Fill from '../fill';
import Provider from '../provider';

/**
 * WordPress Dependencies
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
		const element = mount(
			<Provider>
				<div>
					<Slot name="chicken" />
				</div>
				<Fill name="chicken">
					content
				</Fill>
			</Provider>
		);

		expect( element.html() ).toBe( '<div>content</div>' );
	} );

	it( 'should render a Fill containing an element', () => {
		const element = mount(
			<Provider>
				<div>
					<Slot name="chicken" />
				</div>
				<Fill name="chicken">
					<span />
				</Fill>
			</Provider>
		);

		expect( element.html() ).toBe( '<div><span></span></div>' );
	} );

	it( 'should render a Fill containing an array', () => {
		const element = mount(
			<Provider>
				<div>
					<Slot name="chicken" />
				</div>
				<Fill name="chicken">
					{ [ <span key="1" />, <div key="2" />, 'text' ] }
				</Fill>
			</Provider>
		);

		expect( element.html() ).toBe( '<div><span></span><div></div>text</div>' );
	} );

	it( 'calls the functions passed as the Slot’s fillProps in the Fill', () => {
		const onClose = jest.fn();

		const element = mount(
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
		);

		element.find( 'button' ).simulate( 'click' );

		expect( onClose ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'should render empty Fills without HTML wrapper when render props used', () => {
		const element = mount(
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
		);

		expect( element.html() ).toBe( '<div></div>' );
	} );

	it( 'should render a string Fill with HTML wrapper when render props used', () => {
		const element = mount(
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
		);

		expect( element.html() ).toBe( '<div><blockquote>content</blockquote></div>' );
	} );

	it( 'should re-render Slot when not bubbling virtually', () => {
		const element = mount(
			<Provider>
				<div>
					<Slot name="egg" />
				</div>
				<Filler name="egg" />
			</Provider>
		);

		expect( element.html() ).toBe( '<div>1</div>' );

		element.find( 'button' ).simulate( 'click' );

		expect( element.html() ).toBe( '<div>2</div>' );
	} );

	it( 'should render in expected order', () => {
		const element = mount(
			<Provider>
				<div key="slot">
					<Slot name="egg" />
				</div>
			</Provider>
		);

		element.setProps( {
			children: [
				<div key="slot">
					<Slot name="egg" />
				</div>,
				<Filler name="egg" key="first" text="first" />,
				<Filler name="egg" key="second" text="second" />,
			],
		} );

		element.setProps( {
			children: [
				<div key="slot">
					<Slot name="egg" />
				</div>,
				<Filler name="egg" key="second" text="second" />,
			],
		} );

		element.setProps( {
			children: [
				<div key="slot">
					<Slot name="egg" />
				</div>,
				<Filler name="egg" key="first" text="first" />,
				<Filler name="egg" key="second" text="second" />,
			],
		} );

		expect( element.html() ).toBe( '<div>firstsecond</div>' );
	} );
} );
