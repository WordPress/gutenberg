/**
 * External dependencies
 */
import { mount } from 'enzyme';

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
	[ false, true ].forEach( ( bubblesVirtually ) => {
		describe( 'bubblesVirtually: ' + bubblesVirtually, () => {
			it( 'should render empty Fills', () => {
				const element = mount(
					<Provider>
						<Slot bubblesVirtually={ bubblesVirtually } name="chicken" />
						<Fill name="chicken" />
					</Provider>
				);

				expect( element.find( 'Slot > div' ).html() ).toBe( '<div></div>' );
			} );

			it( 'should render a string Fill', () => {
				const element = mount(
					<Provider>
						<Fill name="chicken">
							content
						</Fill>
						<Slot bubblesVirtually={ bubblesVirtually } name="chicken" />
					</Provider>
				);

				expect( element.find( 'Slot > div' ).html() ).toBe( '<div>content</div>' );
			} );

			it( 'should render a Fill containing an element', () => {
				const element = mount(
					<Provider>
						<Fill name="chicken">
							<span />
						</Fill>
						<Slot bubblesVirtually={ bubblesVirtually } name="chicken" />
					</Provider>
				);

				expect( element.find( 'Slot > div' ).html() ).toBe( '<div><span></span></div>' );
			} );

			it( 'should render a Fill containing an array', () => {
				const element = mount(
					<Provider>
						<Fill name="chicken">
							{ [ <span key="1" />, <div key="2" />, 'text' ] }
						</Fill>
						<Slot bubblesVirtually={ bubblesVirtually } name="chicken" />
					</Provider>
				);

				expect( element.find( 'Slot > div' ).html() ).toBe( '<div><span></span><div></div>text</div>' );
			} );

			it( 'should render a Fill registered after slot mounted', () => {
				const element = mount(
					<Provider>
						<Slot bubblesVirtually={ bubblesVirtually } name="chicken" />
						<Fill name="chicken">
							<span />
						</Fill>
					</Provider>
				);

				expect( element.find( 'Slot > div' ).html() ).toBe( '<div><span></span></div>' );
			} );

			it( 'calls the functions passed as the Slot\'s fillProps in the Fill', () => {
				const onClose = jest.fn();

				const element = mount(
					<Provider>
						<Fill name="chicken">
							{ ( props ) => {
								return (
									<button onClick={ props.onClose }>Click me</button>
								);
							} }
						</Fill>
						<Slot bubblesVirtually={ bubblesVirtually } name="chicken" fillProps={ { onClose: onClose } } />
					</Provider>
				);

				element.find( 'button' ).simulate( 'click' );

				expect( onClose ).toHaveBeenCalled();
			} );

			it( 'reconciles updates to props passed as the Slot\'s fillProps in the Fill', () => {
				const firstOnClose = jest.fn();
				const secondOnClose = jest.fn();

				let onClose = firstOnClose;
				class UpdatingSlot extends Component {
					componentDidMount() {
						this.forceUpdate();
					}

					render() {
						switch ( onClose ) {
							case undefined: onClose = firstOnClose; break;
							case firstOnClose: onClose = secondOnClose; break;
						}

						return <Slot bubblesVirtually={ bubblesVirtually } name="chicken" fillProps={ { onClose } } />;
					}
				}

				const element = mount(
					<Provider>
						<Fill name="chicken">
							{ ( props ) => {
								return (
									<button onClick={ props.onClose }>Click me</button>
								);
							} }
						</Fill>
						<UpdatingSlot />
					</Provider>
				);
				element.find( 'button' ).simulate( 'click' );

				expect( firstOnClose ).not.toHaveBeenCalled();
				expect( secondOnClose ).toHaveBeenCalled();
			} );

			it( 'should re-render Slot when not bubbling virtually', () => {
				const element = mount(
					<Provider>
						<Filler name="egg" />
						<Slot bubblesVirtually={ bubblesVirtually } name="egg" />
					</Provider>
				);

				expect( element.find( 'Slot > div' ).html() ).toBe( '<div>1</div>' );

				element.find( 'button' ).simulate( 'click' );

				expect( element.find( 'Slot > div' ).html() ).toBe( '<div>2</div>' );
			} );

			it( 'should render in expected order', () => {
				const element = mount(
					<Provider>
						<Slot bubblesVirtually={ bubblesVirtually } name="egg" key="slot" />
					</Provider>
				);

				element.setProps( {
					children: [
						<Filler name="egg" key="first" text="first" />,
						<Filler name="egg" key="second" text="second" />,
						<Slot bubblesVirtually={ bubblesVirtually } name="egg" key="slot" />,
					],
				} );

				element.setProps( {
					children: [
						<Filler name="egg" key="second" text="second" />,
						<Slot bubblesVirtually={ bubblesVirtually } name="egg" key="slot" />,
					],
				} );

				element.setProps( {
					children: [
						<Filler name="egg" key="first" text="first" />,
						<Filler name="egg" key="second" text="second" />,
						<Slot bubblesVirtually={ bubblesVirtually } name="egg" key="slot" />,
					],
				} );

				expect( element.find( 'Slot > div' ).html() ).toBe( '<div>firstsecond</div>' );
			} );
		} );
	} );
} );
