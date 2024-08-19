/**
 * External dependencies
 */
import { screen } from '@testing-library/react';
import { render } from '@ariakit/test/react';
import userEvent from '@testing-library/user-event';

/**
 * Internal dependencies
 */
import { Slot, Fill, Provider } from '../';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';

function createContainer() {
	const container = document.createElement( 'div' );
	document.body.appendChild( container );
	return container;
}
class Filler extends Component {
	constructor() {
		super( ...arguments );

		this.state = {
			num: 1,
		};
	}
	render() {
		return [
			<button
				key="1"
				type="button"
				onClick={ () => this.setState( { num: this.state.num + 1 } ) }
			/>,
			<Fill name={ this.props.name } key="2">
				{ this.props.text || this.state.num.toString() }
			</Fill>,
		];
	}
}

describe( 'Slot', () => {
	it( 'should render empty Fills', async () => {
		const container = createContainer();
		await render(
			<Provider>
				<div>
					<Slot name="chicken" />
				</div>
				<Fill name="chicken" />
			</Provider>,
			{ container }
		);

		expect( container ).toMatchSnapshot();
	} );

	it( 'should render a string Fill', async () => {
		const container = createContainer();
		await render(
			<Provider>
				<div>
					<Slot name="chicken" />
				</div>
				<Fill name="chicken">content</Fill>
			</Provider>,
			{ container }
		);

		expect( container ).toMatchSnapshot();
	} );

	it( 'should render a Fill containing an element', async () => {
		const container = createContainer();
		await render(
			<Provider>
				<div>
					<Slot name="chicken" />
				</div>
				<Fill name="chicken">
					<span />
				</Fill>
			</Provider>,
			{ container }
		);

		expect( container ).toMatchSnapshot();
	} );

	it( 'should render a Fill containing an array', async () => {
		const container = createContainer();
		await render(
			<Provider>
				<div>
					<Slot name="chicken" />
				</div>
				<Fill name="chicken">
					{ [ <span key="1" />, <div key="2" />, 'text' ] }
				</Fill>
			</Provider>,
			{ container }
		);

		expect( container ).toMatchSnapshot();
	} );

	it( 'calls the functions passed as the Slot’s fillProps in the Fill', async () => {
		const onClose = jest.fn();
		const user = userEvent.setup();
		await render(
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

		await user.click( screen.getByText( 'Click me' ) );

		expect( onClose ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'should render empty Fills without HTML wrapper when render props used', async () => {
		const container = createContainer();
		await render(
			<Provider>
				<div>
					<Slot name="chicken">
						{ ( fills ) =>
							[ ...fills ].length ? (
								<blockquote>{ fills }</blockquote>
							) : null
						}
					</Slot>
				</div>
				<Fill name="chicken" />
			</Provider>,
			{ container }
		);

		expect( container ).toMatchSnapshot();
	} );

	it( 'should render a string Fill with HTML wrapper when render props used', async () => {
		const container = createContainer();
		await render(
			<Provider>
				<div>
					<Slot name="chicken">
						{ ( fills ) =>
							fills && <blockquote>{ fills }</blockquote>
						}
					</Slot>
				</div>
				<Fill name="chicken">content</Fill>
			</Provider>,
			{ container }
		);

		expect( container ).toMatchSnapshot();
	} );

	it( 'should re-render Slot when not bubbling virtually', async () => {
		const user = userEvent.setup();
		const container = createContainer();
		await render(
			<Provider>
				<div>
					<Slot name="egg" />
				</div>
				<Filler name="egg" />
			</Provider>,
			{ container }
		);

		expect( container ).toMatchSnapshot();

		await user.click( screen.getByRole( 'button' ) );

		expect( container ).toMatchSnapshot();
	} );

	it( 'should render in expected order when fills always mounted', async () => {
		const container = createContainer();
		const { rerender } = await render(
			<Provider>
				<div key="slot">
					<Slot name="egg" />
				</div>
			</Provider>,
			{ container }
		);

		await rerender(
			<Provider>
				<div key="slot">
					<Slot name="egg" />
				</div>
				<Fill name="egg" key="first">
					first
				</Fill>
				<Fill name="egg" key="second">
					second
				</Fill>
			</Provider>
		);

		await rerender(
			<Provider>
				<div key="slot">
					<Slot name="egg" />
				</div>
				<Fill name="egg" key="first" />
				<Fill name="egg" key="second">
					second
				</Fill>
				<Fill name="egg" key="third">
					third
				</Fill>
			</Provider>
		);

		await rerender(
			<Provider>
				<div key="slot">
					<Slot name="egg" />
				</div>
				<Fill name="egg" key="first">
					first (rerendered)
				</Fill>
				<Fill name="egg" key="second">
					second
				</Fill>
				<Fill name="egg" key="third">
					third
				</Fill>
				<Fill name="egg" key="fourth">
					fourth (new)
				</Fill>
			</Provider>
		);

		expect( container ).toMatchSnapshot();
	} );

	it( 'should render in expected order when fills unmounted', async () => {
		const container = createContainer();
		const { rerender } = await render(
			<Provider>
				<div key="slot">
					<Slot name="egg" />
				</div>
			</Provider>,
			{ container }
		);

		await rerender(
			<Provider>
				<div key="slot">
					<Slot name="egg" />
				</div>
				<Filler name="egg" key="first" text="first" />
				<Filler name="egg" key="second" text="second" />
			</Provider>
		);

		await rerender(
			<Provider>
				<div key="slot">
					<Slot name="egg" />
				</div>
				<Filler name="egg" key="second" text="second" />
				<Filler name="egg" key="third" text="third" />
			</Provider>
		);

		await rerender(
			<Provider>
				<div key="slot">
					<Slot name="egg" />
				</div>
				<Filler name="egg" key="first" text="first (rerendered)" />
				<Filler name="egg" key="second" text="second" />
				<Filler name="egg" key="third" text="third" />
				<Filler name="egg" key="fourth" text="fourth (new)" />
			</Provider>
		);

		expect( container ).toMatchSnapshot();
	} );

	it( 'should warn without a Provider', async () => {
		const container = createContainer();
		await render(
			<>
				<div>
					<Slot name="chicken" bubblesVirtually />
				</div>
				<Fill name="chicken" />
			</>,
			{ container }
		);

		expect( container ).toMatchSnapshot();
		expect( console ).toHaveWarned();
	} );

	describe.each( [ false, true ] )(
		'bubblesVirtually %p',
		( bubblesVirtually ) => {
			it( 'should subsume another slot by the same name', async () => {
				const container = createContainer();
				const { rerender } = await render(
					<Provider>
						<div data-position="first">
							<Slot
								name="egg"
								bubblesVirtually={ bubblesVirtually }
							/>
						</div>
						<div data-position="second"></div>
						<Fill name="egg">Content</Fill>
					</Provider>,
					{ container }
				);

				await rerender(
					<Provider>
						<div data-position="first">
							<Slot
								name="egg"
								bubblesVirtually={ bubblesVirtually }
							/>
						</div>
						<div data-position="second">
							<Slot
								name="egg"
								bubblesVirtually={ bubblesVirtually }
							/>
						</div>
						<Fill name="egg">Content</Fill>
					</Provider>
				);

				expect( container ).toMatchSnapshot();

				await rerender(
					<Provider>
						<div data-position="first"></div>
						<div data-position="second">
							<Slot
								name="egg"
								bubblesVirtually={ bubblesVirtually }
							/>
						</div>
						<Fill name="egg">Content</Fill>
					</Provider>
				);

				expect( container ).toMatchSnapshot();
			} );

			it( 'should unmount two slots with the same name', async () => {
				const container = createContainer();
				const { rerender } = await render(
					<Provider>
						<div data-position="first">
							<Slot
								name="egg"
								bubblesVirtually={ bubblesVirtually }
							/>
						</div>
						<div data-position="second">
							<Slot
								name="egg"
								bubblesVirtually={ bubblesVirtually }
							/>
						</div>
						<Fill name="egg">Content</Fill>
					</Provider>,
					{ container }
				);
				await rerender(
					<Provider>
						<div data-position="first">
							<Slot
								name="egg"
								bubblesVirtually={ bubblesVirtually }
							/>
						</div>
						<div data-position="second" />
						<Fill name="egg">Content</Fill>
					</Provider>
				);
				await rerender(
					<Provider>
						<div data-position="first" />
						<div data-position="second" />
						<Fill name="egg">Content</Fill>
					</Provider>
				);
				expect( container ).toMatchSnapshot();
			} );
		}
	);
} );
