/**
 * External dependencies
 */
import { create } from 'react-test-renderer';
import { isEmpty } from 'lodash';

/**
 * WordPress Dependencies
 */
import { Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Slot from '../slot';
import Fill from '../fill';
import Provider from '../provider';

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
	function expectEmptyFill( wrapper ) {
		expect( wrapper.root.findByType( Fill ).children ).toHaveLength( 0 );
	}

	it( 'should render empty Fills', () => {
		const wrapper = create(
			<Provider>
				<Slot name="chicken" />
				<Fill name="chicken" />
			</Provider>
		);

		const slot = wrapper.root.findByType( Slot );
		expect( slot.children ).toHaveLength( 0 );
		expectEmptyFill( wrapper );
	} );

	it( 'should render a string Fill', () => {
		const wrapper = create(
			<Provider>
				<Slot name="chicken" />
				<Fill name="chicken">
					content
				</Fill>
			</Provider>
		);

		const slot = wrapper.root.findByType( Slot );
		expect( slot.children ).toHaveLength( 1 );
		expect( slot.children[ 0 ] ).toBe( 'content' );
		expectEmptyFill( wrapper );
	} );

	it( 'should render a Fill containing an element', () => {
		const wrapper = create(
			<Provider>
				<Slot name="chicken" />
				<Fill name="chicken">
					<span />
				</Fill>
			</Provider>
		);

		const slot = wrapper.root.findByType( Slot );
		expect( slot.children ).toHaveLength( 1 );
		expect( slot.children[ 0 ].type ).toBe( 'span' );
		expectEmptyFill( wrapper );
	} );

	it( 'should render a Fill containing an array', () => {
		const wrapper = create(
			<Provider>
				<Slot name="chicken" />
				<Fill name="chicken">
					{ [ <span key="1" />, <div key="2" />, 'text' ] }
				</Fill>
			</Provider>
		);

		const slot = wrapper.root.findByType( Slot );
		expect( slot.children ).toHaveLength( 3 );
		expect( slot.children[ 0 ].type ).toBe( 'span' );
		expect( slot.children[ 1 ].type ).toBe( 'div' );
		expect( slot.children[ 2 ] ).toBe( 'text' );
		expectEmptyFill( wrapper );
	} );

	it( 'calls the functions passed as the Slot’s fillProps in the Fill', () => {
		const onClose = jest.fn();

		const wrapper = create(
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

		wrapper.root.findByType( Slot ).findByType( 'button' ).props.onClick();

		expect( onClose ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'should render empty Fills without HTML wrapper when render props used', () => {
		const wrapper = create(
			<Provider>
				<Slot name="chicken">
					{ ( fills ) => ( ! isEmpty( fills ) && (
						<blockquote>
							{ fills }
						</blockquote>
					) ) }
				</Slot>
				<Fill name="chicken" />
			</Provider>
		);

		const slot = wrapper.root.findByType( Slot );
		expect( slot.children ).toHaveLength( 0 );
		expectEmptyFill( wrapper );
	} );

	it( 'should render a string Fill with HTML wrapper when render props used', () => {
		const wrapper = create(
			<Provider>
				<Slot name="chicken">
					{ ( fills ) => ( fills && (
						<blockquote>
							{ fills }
						</blockquote>
					) ) }
				</Slot>
				<Fill name="chicken">
					content
				</Fill>
			</Provider>
		);

		const slot = wrapper.root.findByType( Slot );
		expect( slot.children ).toHaveLength( 1 );
		expect( slot.children[ 0 ].type ).toBe( 'blockquote' );
		expect( slot.children[ 0 ].children ).toHaveLength( 1 );
		expect( slot.children[ 0 ].children[ 0 ] ).toBe( 'content' );
		expectEmptyFill( wrapper );
	} );

	it( 'should re-render Slot when not bubbling virtually', () => {
		const wrapper = create(
			<Provider>
				<Slot name="egg" />
				<Filler name="egg" />
			</Provider>
		);

		let slot = wrapper.root.findByType( Slot );
		expect( slot.children ).toHaveLength( 1 );
		expect( slot.children[ 0 ] ).toBe( '1' );

		wrapper.root.findByType( Filler ).findByType( 'button' ).props.onClick();

		slot = wrapper.root.findByType( Slot );
		expect( slot.children ).toHaveLength( 1 );
		expect( slot.children[ 0 ] ).toBe( '2' );
	} );

	it( 'should render in expected order', () => {
		const wrapper = create(
			<Provider>
				<Slot name="egg" key="slot" />
			</Provider>
		);

		wrapper.update(
			<Provider>
				<Slot name="egg" key="slot" />
				<Filler name="egg" key="first" text="first" />
				<Filler name="egg" key="second" text="second" />
			</Provider>
		);

		wrapper.update(
			<Provider>
				<Slot name="egg" key="slot" />
				<Filler name="egg" key="second" text="second" />
			</Provider>
		);

		wrapper.update(
			<Provider>
				<Slot name="egg" key="slot" />
				<Filler name="egg" key="first" text="first" />
				<Filler name="egg" key="second" text="second" />
			</Provider>
		);

		const slot = wrapper.root.findByType( Slot );
		expect( slot.children ).toHaveLength( 2 );
		expect( slot.children[ 0 ] ).toBe( 'first' );
		expect( slot.children[ 1 ] ).toBe( 'second' );
	} );
} );
