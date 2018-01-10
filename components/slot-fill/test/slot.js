/**
 * External dependencies
 */
import { mount } from 'enzyme';

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
		const element = mount(
			<Provider>
				<Slot name="chicken" />
				<Fill name="chicken" />
			</Provider>
		);

		expect( element.find( 'Slot > div' ).html() ).toBe( '<div></div>' );
	} );

	it( 'should render a string Fill', () => {
		const element = mount(
			<Provider>
				<Slot name="chicken" />
				<Fill name="chicken">
					content
				</Fill>
			</Provider>
		);

		expect( element.find( 'Slot > div' ).html() ).toBe( '<div>content</div>' );
	} );

	it( 'should render a Fill containing an element', () => {
		const element = mount(
			<Provider>
				<Slot name="chicken" />
				<Fill name="chicken">
					<span />
				</Fill>
			</Provider>
		);

		expect( element.find( 'Slot > div' ).html() ).toBe( '<div><span></span></div>' );
	} );

	it( 'should render a Fill containing an array', () => {
		const element = mount(
			<Provider>
				<Slot name="chicken" />
				<Fill name="chicken">
					{ [ <span key="1" />, <div key="2" />, 'text' ] }
				</Fill>
			</Provider>
		);

		expect( element.find( 'Slot > div' ).html() ).toBe( '<div><span></span><div></div>text</div>' );
	} );

	it( 'should re-render Slot when not bubbling virtually', () => {
		const element = mount(
			<Provider>
				<Slot name="egg" />
				<Filler name="egg" />
			</Provider>
		);

		expect( element.find( 'Slot > div' ).html() ).toBe( '<div>1</div>' );

		element.find( 'button' ).simulate( 'click' );

		expect( element.find( 'Slot > div' ).html() ).toBe( '<div>2</div>' );
	} );

	it( 'should render in expected order', () => {
		const element = mount(
			<Provider>
				<Slot name="egg" key="slot" />
			</Provider>
		);

		element.setProps( {
			children: [
				<Slot name="egg" key="slot" />,
				<Filler name="egg" key="first" text="first" />,
				<Filler name="egg" key="second" text="second" />,
			],
		} );

		element.setProps( {
			children: [
				<Slot name="egg" key="slot" />,
				<Filler name="egg" key="second" text="second" />,
			],
		} );

		element.setProps( {
			children: [
				<Slot name="egg" key="slot" />,
				<Filler name="egg" key="first" text="first" />,
				<Filler name="egg" key="second" text="second" />,
			],
		} );

		expect( element.find( 'Slot > div' ).html() ).toBe( '<div>firstsecond</div>' );
	} );
} );
