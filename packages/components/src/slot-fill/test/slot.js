/**
 * External dependencies
 */
import { isEmpty, noop } from 'lodash';
import ReactTestRenderer from 'react-test-renderer';
import { shallow } from 'enzyme';

/**
 * Internal dependencies
 */
import Slot from '../slot';
import Fill from '../fill';
import Provider from '../context';

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

	describe( 'Manage Slots', () => {
		it( 'should return the named slot', () => {
			const provider = shallow( <Provider></Provider> );
			const instance = provider.instance();
			const forceUpdate = jest.fn();
			const slot = { name: 'slot', forceUpdate };

			instance.registerSlot( 'test', slot );
			expect( instance.getSlot( 'test' ) ).toBe( slot );
			expect( forceUpdate ).toHaveBeenCalledTimes( 1 );
		} );

		it( 'should remove the named slot', () => {
			const provider = shallow( <Provider></Provider> );
			const instance = provider.instance();
			const forceUpdate = jest.fn();
			const slot = { name: 'slot', forceUpdate };

			instance.registerSlot( 'test', slot );
			instance.unregisterSlot( 'test' );

			expect( instance.getSlot( 'test' ) ).toBe( undefined );
			expect( forceUpdate ).toHaveBeenCalledTimes( 2 );
		} );

		it( 'should not allow multiple slots of same name', () => {
			const provider = shallow( <Provider></Provider> );
			const instance = provider.instance();
			const slot1 = { name: 'slot1', forceUpdate: noop };
			const slot2 = { name: 'slot2', forceUpdate: noop };

			instance.registerSlot( 'test', slot1 );
			instance.registerSlot( 'test', slot2 );

			expect( instance.getSlot( 'test' ) ).toBe( slot1 );
		} );

		it( 'should allow multiple fills of same name', () => {
			const provider = shallow( <Provider></Provider> );
			const instance = provider.instance();
			const fill1 = { name: 'fill1', forceUpdate: noop };
			const fill2 = { name: 'fill2', forceUpdate: noop };

			instance.registerFill( 'test', fill1 );
			instance.registerFill( 'test', fill2 );

			expect( instance.getFills( 'test' ) ).toEqual( [ fill1, fill2 ] );
		} );

		it( 'should force update of slot and fill when slot is removed', () => {
			const provider = shallow( <Provider></Provider> );
			const instance = provider.instance();
			const forceUpdateFill = jest.fn();
			const forceUpdateSlot = jest.fn();
			const slot = { name: 'slot', forceUpdate: forceUpdateSlot };
			const fill = { name: 'fill', forceUpdate: forceUpdateFill };

			instance.registerSlot( 'test', slot );
			instance.registerFill( 'test', fill );
			instance.unregisterSlot( 'test' );

			expect( forceUpdateFill ).toHaveBeenCalledTimes( 1 ); // Slot is unregistered
			expect( forceUpdateSlot ).toHaveBeenCalledTimes( 3 ); // Slot is registered, fill is registered, slot is unregistered
		} );
	} );
} );
