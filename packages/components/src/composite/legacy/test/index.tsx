/**
 * External dependencies
 */
import {
	queryByAttribute,
	render,
	screen,
	renderHook,
} from '@testing-library/react';
import { press, waitFor } from '@ariakit/test';

/**
 * Internal dependencies
 */
import {
	Composite,
	CompositeGroup,
	CompositeItem,
	useCompositeState,
} from '..';

// This is necessary because of how Ariakit calculates page up and
// page down. Without this, nothing has a height, and so paging up
// and down doesn't behave as expected in tests.

let clientHeightSpy: jest.SpiedGetter<
	typeof HTMLElement.prototype.clientHeight
>;

beforeAll( () => {
	clientHeightSpy = jest
		.spyOn( HTMLElement.prototype, 'clientHeight', 'get' )
		.mockImplementation( function getClientHeight( this: HTMLElement ) {
			if ( this.tagName === 'BODY' ) {
				return window.outerHeight;
			}
			return 50;
		} );
} );

afterAll( () => {
	clientHeightSpy?.mockRestore();
} );

type InitialState = Parameters< typeof useCompositeState >[ 0 ];
type CompositeState = ReturnType< typeof useCompositeState >;
type CompositeStateProps = CompositeState | { state: CompositeState };

async function renderAndValidate( ...args: Parameters< typeof render > ) {
	const view = render( ...args );
	await waitFor( () => {
		const activeButton = queryByAttribute(
			'data-active-item',
			view.baseElement,
			'true'
		);
		expect( activeButton ).not.toBeNull();
	} );
	return view;
}

function getKeys( rtl: boolean ) {
	return {
		previous: rtl ? 'ArrowRight' : 'ArrowLeft',
		next: rtl ? 'ArrowLeft' : 'ArrowRight',
		first: rtl ? 'End' : 'Home',
		last: rtl ? 'Home' : 'End',
	};
}

function OneDimensionalTest( props: CompositeStateProps ) {
	return (
		<Composite
			{ ...props }
			aria-label={ expect.getState().currentTestName }
		>
			<CompositeItem { ...props }>Item 1</CompositeItem>
			<CompositeItem { ...props }>Item 2</CompositeItem>
			<CompositeItem { ...props }>Item 3</CompositeItem>
		</Composite>
	);
}

function getOneDimensionalItems() {
	return {
		item1: screen.getByText( 'Item 1' ),
		item2: screen.getByText( 'Item 2' ),
		item3: screen.getByText( 'Item 3' ),
	};
}

function TwoDimensionalTest( props: CompositeStateProps ) {
	return (
		<Composite
			{ ...props }
			aria-label={ expect.getState().currentTestName }
		>
			<CompositeGroup role="row" { ...props }>
				<CompositeItem { ...props }>Item A1</CompositeItem>
				<CompositeItem { ...props }>Item A2</CompositeItem>
				<CompositeItem { ...props }>Item A3</CompositeItem>
			</CompositeGroup>
			<CompositeGroup role="row" { ...props }>
				<CompositeItem { ...props }>Item B1</CompositeItem>
				<CompositeItem { ...props }>Item B2</CompositeItem>
				<CompositeItem { ...props }>Item B3</CompositeItem>
			</CompositeGroup>
			<CompositeGroup role="row" { ...props }>
				<CompositeItem { ...props }>Item C1</CompositeItem>
				<CompositeItem { ...props }>Item C2</CompositeItem>
				<CompositeItem { ...props }>Item C3</CompositeItem>
			</CompositeGroup>
		</Composite>
	);
}

function getTwoDimensionalItems() {
	return {
		itemA1: screen.getByText( 'Item A1' ),
		itemA2: screen.getByText( 'Item A2' ),
		itemA3: screen.getByText( 'Item A3' ),
		itemB1: screen.getByText( 'Item B1' ),
		itemB2: screen.getByText( 'Item B2' ),
		itemB3: screen.getByText( 'Item B3' ),
		itemC1: screen.getByText( 'Item C1' ),
		itemC2: screen.getByText( 'Item C2' ),
		itemC3: screen.getByText( 'Item C3' ),
	};
}

function ShiftTest( props: CompositeStateProps ) {
	return (
		<Composite
			{ ...props }
			aria-label={ expect.getState().currentTestName }
		>
			<CompositeGroup role="row" { ...props }>
				<CompositeItem { ...props }>Item A1</CompositeItem>
			</CompositeGroup>
			<CompositeGroup role="row" { ...props }>
				<CompositeItem { ...props }>Item B1</CompositeItem>
				<CompositeItem { ...props }>Item B2</CompositeItem>
			</CompositeGroup>
			<CompositeGroup role="row" { ...props }>
				<CompositeItem { ...props }>Item C1</CompositeItem>
				<CompositeItem { ...props } disabled>
					Item C2
				</CompositeItem>
			</CompositeGroup>
		</Composite>
	);
}

function getShiftTestItems() {
	return {
		itemA1: screen.getByText( 'Item A1' ),
		itemB1: screen.getByText( 'Item B1' ),
		itemB2: screen.getByText( 'Item B2' ),
		itemC1: screen.getByText( 'Item C1' ),
		itemC2: screen.getByText( 'Item C2' ),
	};
}

// Checking for deprecation warnings before other tests because the `deprecated`
// utility only fires a console.warn the first time a component is rendered.
describe( 'Shows a deprecation warning', () => {
	it( 'useCompositeState', () => {
		renderHook( () => useCompositeState() );
		expect( console ).toHaveWarnedWith(
			'wp.components.__unstableUseCompositeState is deprecated since version 6.7. Please use Composite instead.'
		);
	} );
	it( 'Composite', () => {
		const Test = () => {
			const props = useCompositeState();
			return <Composite { ...props } />;
		};
		render( <Test /> );
		expect( console ).toHaveWarnedWith(
			'wp.components.__unstableComposite is deprecated since version 6.7. Please use Composite instead.'
		);
	} );
	it( 'CompositeItem', () => {
		const Test = () => {
			const props = useCompositeState();
			return (
				<Composite { ...props }>
					<CompositeItem { ...props } />
				</Composite>
			);
		};
		render( <Test /> );
		expect( console ).toHaveWarnedWith(
			'wp.components.__unstableCompositeItem is deprecated since version 6.7. Please use Composite.Item instead.'
		);
	} );
	it( 'CompositeGroup', () => {
		const Test = () => {
			const props = useCompositeState();
			return (
				<Composite { ...props }>
					<CompositeGroup { ...props }>
						<CompositeItem { ...props } />
					</CompositeGroup>
				</Composite>
			);
		};
		render( <Test /> );
		expect( console ).toHaveWarnedWith(
			'wp.components.__unstableCompositeGroup is deprecated since version 6.7. Please use Composite.Group or Composite.Row instead.'
		);
	} );
} );

describe.each( [
	[
		'With "spread" state',
		( initialState?: InitialState ) => useCompositeState( initialState ),
	],
	[
		'With `state` prop',
		( initialState?: InitialState ) => ( {
			state: useCompositeState( initialState ),
		} ),
	],
] )( '%s', ( __, useProps ) => {
	test( 'Renders as a single tab stop', async () => {
		const Test = () => (
			<>
				<button>Before</button>
				<OneDimensionalTest { ...useProps() } />
				<button>After</button>
			</>
		);
		await renderAndValidate( <Test /> );

		await press.Tab();
		expect( screen.getByText( 'Before' ) ).toHaveFocus();
		await press.Tab();
		expect( screen.getByText( 'Item 1' ) ).toHaveFocus();
		await press.Tab();
		expect( screen.getByText( 'After' ) ).toHaveFocus();
		await press.ShiftTab();
		expect( screen.getByText( 'Item 1' ) ).toHaveFocus();
	} );

	test( 'Excludes disabled items', async () => {
		const Test = () => {
			const props = useProps();
			return (
				<Composite
					{ ...props }
					aria-label={ expect.getState().currentTestName }
				>
					<CompositeItem { ...props }>Item 1</CompositeItem>
					<CompositeItem { ...props } disabled>
						Item 2
					</CompositeItem>
					<CompositeItem { ...props }>Item 3</CompositeItem>
				</Composite>
			);
		};
		await renderAndValidate( <Test /> );

		const { item1, item2, item3 } = getOneDimensionalItems();

		expect( item2 ).toBeDisabled();

		await press.Tab();
		expect( item1 ).toHaveFocus();
		await press.ArrowDown();
		expect( item2 ).not.toHaveFocus();
		expect( item3 ).toHaveFocus();
	} );

	test( 'Includes focusable disabled items', async () => {
		const Test = () => {
			const props = useProps();
			return (
				<Composite
					{ ...props }
					aria-label={ expect.getState().currentTestName }
				>
					<CompositeItem { ...props }>Item 1</CompositeItem>
					<CompositeItem { ...props } disabled focusable>
						Item 2
					</CompositeItem>
					<CompositeItem { ...props }>Item 3</CompositeItem>
				</Composite>
			);
		};
		await renderAndValidate( <Test /> );
		const { item1, item2, item3 } = getOneDimensionalItems();

		expect( item2 ).toBeEnabled();
		expect( item2 ).toHaveAttribute( 'aria-disabled', 'true' );

		await press.Tab();
		expect( item1 ).toHaveFocus();
		await press.ArrowDown();
		expect( item2 ).toHaveFocus();
		expect( item3 ).not.toHaveFocus();
	} );

	test( 'Supports `baseId`', async () => {
		const Test = () => (
			<OneDimensionalTest
				{ ...useProps( {
					baseId: 'test-id',
				} ) }
			/>
		);
		await renderAndValidate( <Test /> );
		const { item1, item2, item3 } = getOneDimensionalItems();

		expect( item1.id ).toMatch( 'test-id-1' );
		expect( item2.id ).toMatch( 'test-id-2' );
		expect( item3.id ).toMatch( 'test-id-3' );
	} );

	test( 'Supports `currentId`', async () => {
		const Test = () => (
			<OneDimensionalTest
				{ ...useProps( {
					baseId: 'test-id',
					currentId: 'test-id-2',
				} ) }
			/>
		);
		await renderAndValidate( <Test /> );
		const { item2 } = getOneDimensionalItems();

		await press.Tab();
		await waitFor( () => expect( item2 ).toHaveFocus() );
	} );
} );

describe.each( [
	[ 'When LTR', false ],
	[ 'When RTL', true ],
] )( '%s', ( _when, rtl ) => {
	const { previous, next, first, last } = getKeys( rtl );

	async function useOneDimensionalTest( initialState?: InitialState ) {
		const Test = () => (
			<OneDimensionalTest
				state={ useCompositeState( { rtl, ...initialState } ) }
			/>
		);
		await renderAndValidate( <Test /> );
		return getOneDimensionalItems();
	}

	async function useTwoDimensionalTest( initialState?: InitialState ) {
		const Test = () => (
			<TwoDimensionalTest
				state={ useCompositeState( { rtl, ...initialState } ) }
			/>
		);
		await renderAndValidate( <Test /> );
		return getTwoDimensionalItems();
	}

	async function useShiftTest( shift: boolean ) {
		const Test = () => (
			<ShiftTest state={ useCompositeState( { rtl, shift } ) } />
		);
		await renderAndValidate( <Test /> );
		return getShiftTestItems();
	}

	describe( 'In one dimension', () => {
		test( 'All directions work with no orientation', async () => {
			const { item1, item2, item3 } = await useOneDimensionalTest();

			await press.Tab();
			expect( item1 ).toHaveFocus();
			await press.ArrowDown();
			expect( item2 ).toHaveFocus();
			await press.ArrowDown();
			expect( item3 ).toHaveFocus();
			await press.ArrowDown();
			expect( item3 ).toHaveFocus();
			await press.ArrowUp();
			expect( item2 ).toHaveFocus();
			await press.ArrowUp();
			expect( item1 ).toHaveFocus();
			await press.ArrowUp();
			expect( item1 ).toHaveFocus();
			await press( next );
			expect( item2 ).toHaveFocus();
			await press( next );
			expect( item3 ).toHaveFocus();
			await press( previous );
			expect( item2 ).toHaveFocus();
			await press( previous );
			expect( item1 ).toHaveFocus();
			await press.End();
			expect( item3 ).toHaveFocus();
			await press.Home();
			expect( item1 ).toHaveFocus();
			await press.PageDown();
			expect( item3 ).toHaveFocus();
			await press.PageUp();
			expect( item1 ).toHaveFocus();
		} );

		test( 'Only left/right work with horizontal orientation', async () => {
			const { item1, item2, item3 } = await useOneDimensionalTest( {
				orientation: 'horizontal',
			} );

			await press.Tab();
			expect( item1 ).toHaveFocus();
			await press.ArrowDown();
			expect( item1 ).toHaveFocus();
			await press( next );
			expect( item2 ).toHaveFocus();
			await press( next );
			expect( item3 ).toHaveFocus();
			await press.ArrowUp();
			expect( item3 ).toHaveFocus();
			await press( previous );
			expect( item2 ).toHaveFocus();
			await press( previous );
			expect( item1 ).toHaveFocus();
			await press.End();
			expect( item3 ).toHaveFocus();
			await press.Home();
			expect( item1 ).toHaveFocus();
			await press.PageDown();
			expect( item3 ).toHaveFocus();
			await press.PageUp();
			expect( item1 ).toHaveFocus();
		} );

		test( 'Only up/down work with vertical orientation', async () => {
			const { item1, item2, item3 } = await useOneDimensionalTest( {
				orientation: 'vertical',
			} );

			await press.Tab();
			expect( item1 ).toHaveFocus();
			await press( next );
			expect( item1 ).toHaveFocus();
			await press.ArrowDown();
			expect( item2 ).toHaveFocus();
			await press.ArrowDown();
			expect( item3 ).toHaveFocus();
			await press( previous );
			expect( item3 ).toHaveFocus();
			await press.ArrowUp();
			expect( item2 ).toHaveFocus();
			await press.ArrowUp();
			expect( item1 ).toHaveFocus();
			await press.End();
			expect( item3 ).toHaveFocus();
			await press.Home();
			expect( item1 ).toHaveFocus();
			await press.PageDown();
			expect( item3 ).toHaveFocus();
			await press.PageUp();
			expect( item1 ).toHaveFocus();
		} );

		test( 'Focus wraps with loop enabled', async () => {
			const { item1, item2, item3 } = await useOneDimensionalTest( {
				loop: true,
			} );

			await press.Tab();
			expect( item1 ).toHaveFocus();
			await press.ArrowDown();
			expect( item2 ).toHaveFocus();
			await press.ArrowDown();
			expect( item3 ).toHaveFocus();
			await press.ArrowDown();
			expect( item1 ).toHaveFocus();
			await press.ArrowUp();
			expect( item3 ).toHaveFocus();
			await press( next );
			expect( item1 ).toHaveFocus();
			await press( previous );
			expect( item3 ).toHaveFocus();
		} );
	} );

	describe( 'In two dimensions', () => {
		test( 'All directions work as standard', async () => {
			const { itemA1, itemA2, itemA3, itemB1, itemB2, itemC1, itemC3 } =
				await useTwoDimensionalTest();

			await press.Tab();
			expect( itemA1 ).toHaveFocus();
			await press.ArrowUp();
			expect( itemA1 ).toHaveFocus();
			await press( previous );
			expect( itemA1 ).toHaveFocus();
			await press.ArrowDown();
			expect( itemB1 ).toHaveFocus();
			await press( next );
			expect( itemB2 ).toHaveFocus();
			await press.ArrowUp();
			expect( itemA2 ).toHaveFocus();
			await press( previous );
			expect( itemA1 ).toHaveFocus();
			await press( last );
			expect( itemA3 ).toHaveFocus();
			await press.PageDown();
			expect( itemC3 ).toHaveFocus();
			await press( next );
			expect( itemC3 ).toHaveFocus();
			await press.ArrowDown();
			expect( itemC3 ).toHaveFocus();
			await press( first );
			expect( itemC1 ).toHaveFocus();
			await press.PageUp();
			expect( itemA1 ).toHaveFocus();
			await press.End( null, { ctrlKey: true } );
			expect( itemC3 ).toHaveFocus();
			await press.Home( null, { ctrlKey: true } );
			expect( itemA1 ).toHaveFocus();
		} );

		test( 'Focus wraps around rows/columns with loop enabled', async () => {
			const { itemA1, itemA2, itemA3, itemB1, itemC1, itemC3 } =
				await useTwoDimensionalTest( { loop: true } );

			await press.Tab();
			expect( itemA1 ).toHaveFocus();
			await press( next );
			expect( itemA2 ).toHaveFocus();
			await press( next );
			expect( itemA3 ).toHaveFocus();
			await press( next );
			expect( itemA1 ).toHaveFocus();
			await press.ArrowDown();
			expect( itemB1 ).toHaveFocus();
			await press.ArrowDown();
			expect( itemC1 ).toHaveFocus();
			await press.ArrowDown();
			expect( itemA1 ).toHaveFocus();
			await press( previous );
			expect( itemA3 ).toHaveFocus();
			await press.ArrowUp();
			expect( itemC3 ).toHaveFocus();
		} );

		test( 'Focus moves between rows/columns with wrap enabled', async () => {
			const { itemA1, itemA2, itemA3, itemB1, itemC1, itemC3 } =
				await useTwoDimensionalTest( { wrap: true } );

			await press.Tab();
			expect( itemA1 ).toHaveFocus();
			await press( next );
			expect( itemA2 ).toHaveFocus();
			await press( next );
			expect( itemA3 ).toHaveFocus();
			await press( next );
			expect( itemB1 ).toHaveFocus();
			await press.ArrowDown();
			expect( itemC1 ).toHaveFocus();
			await press.ArrowDown();
			expect( itemA2 ).toHaveFocus();
			await press( previous );
			expect( itemA1 ).toHaveFocus();
			await press( previous );
			expect( itemA1 ).toHaveFocus();
			await press.ArrowUp();
			expect( itemA1 ).toHaveFocus();
			await press.End( itemA1, { ctrlKey: true } );
			expect( itemC3 ).toHaveFocus();
			await press( next );
			expect( itemC3 ).toHaveFocus();
			await press.ArrowDown();
			expect( itemC3 ).toHaveFocus();
		} );

		test( 'Focus wraps around start/end with loop and wrap enabled', async () => {
			const { itemA1, itemC3 } = await useTwoDimensionalTest( {
				loop: true,
				wrap: true,
			} );

			await press.Tab();
			expect( itemA1 ).toHaveFocus();
			await press( previous );
			expect( itemC3 ).toHaveFocus();
			await press.ArrowDown();
			expect( itemA1 ).toHaveFocus();
			await press.ArrowUp();
			expect( itemC3 ).toHaveFocus();
			await press( next );
			expect( itemA1 ).toHaveFocus();
		} );

		test( 'Focus shifts if vertical neighbour unavailable when shift enabled', async () => {
			const { itemA1, itemB1, itemB2, itemC1 } =
				await useShiftTest( true );

			await press.Tab();
			expect( itemA1 ).toHaveFocus();
			await press.ArrowDown();
			expect( itemB1 ).toHaveFocus();
			await press( next );
			expect( itemB2 ).toHaveFocus();
			await press.ArrowUp();
			// A2 doesn't exist
			expect( itemA1 ).toHaveFocus();
			await press.ArrowDown();
			expect( itemB1 ).toHaveFocus();
			await press( next );
			expect( itemB2 ).toHaveFocus();
			await press.ArrowDown();
			// C2 is disabled
			expect( itemC1 ).toHaveFocus();
		} );

		test( 'Focus does not shift if vertical neighbour unavailable when shift not enabled', async () => {
			const { itemA1, itemB1, itemB2 } = await useShiftTest( false );

			await press.Tab();
			expect( itemA1 ).toHaveFocus();
			await press.ArrowDown();
			expect( itemB1 ).toHaveFocus();
			await press( next );
			expect( itemB2 ).toHaveFocus();
			await press.ArrowUp();
			// A2 doesn't exist
			expect( itemB2 ).toHaveFocus();
			await press.ArrowDown();
			// C2 is disabled
			expect( itemB2 ).toHaveFocus();
		} );
	} );
} );
