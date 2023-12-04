// eslint-disable-next-line eslint-comments/disable-enable-pair
/* eslint-disable testing-library/render-result-naming-convention */

/**
 * External dependencies
 */
import { act, renderHook, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * WordPress dependencies
 */
import { createRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import {
	Composite as ReakitComposite,
	CompositeGroup as ReakitCompositeGroup,
	CompositeItem as ReakitCompositeItem,
	useCompositeState as ReakitUseCompositeState,
} from '..';
import type { CompositeInitialState, CompositeStateReturn } from '../types';

const COMPOSITE_SUITES = {
	reakit: {
		Composite: ReakitComposite,
		CompositeGroup: ReakitCompositeGroup,
		CompositeItem: ReakitCompositeItem,
		useCompositeState: ReakitUseCompositeState,
	},
};

type InitialState = Partial< CompositeInitialState >;

const DEFAULT_BASE_ID = 'base';

const DEFAULT_INITIAL_STATE: CompositeInitialState = {
	baseId: DEFAULT_BASE_ID,
	currentId: undefined,
	loop: false,
	orientation: undefined,
	rtl: false,
	shift: false,
	unstable_virtual: false,
	wrap: false,
};

const DEFAULT_PROPS = {
	...DEFAULT_INITIAL_STATE,
	groups: [],
	items: [],
	unstable_hasActiveWidget: false,
	unstable_idCountRef: { current: 0 },
	unstable_includesBaseElement: false,
	unstable_moves: 0,
};

const DEFAULT_ACTIONS = {
	down: expect.any( Function ),
	first: expect.any( Function ),
	last: expect.any( Function ),
	move: expect.any( Function ),
	next: expect.any( Function ),
	previous: expect.any( Function ),
	registerGroup: expect.any( Function ),
	registerItem: expect.any( Function ),
	reset: expect.any( Function ),
	setBaseId: expect.any( Function ),
	setCurrentId: expect.any( Function ),
	setLoop: expect.any( Function ),
	setOrientation: expect.any( Function ),
	setRTL: expect.any( Function ),
	setShift: expect.any( Function ),
	setWrap: expect.any( Function ),
	sort: expect.any( Function ),
	unregisterGroup: expect.any( Function ),
	unregisterItem: expect.any( Function ),
	unstable_setHasActiveWidget: expect.any( Function ),
	unstable_setIncludesBaseElement: expect.any( Function ),
	unstable_setVirtual: expect.any( Function ),
	up: expect.any( Function ),
};

const DEFAULT_STATE = {
	...DEFAULT_PROPS,
	...DEFAULT_ACTIONS,
};

function createItemRef( index: number ) {
	const node = document.createElement( 'div' );
	node.id = '' + index;
	node.compareDocumentPosition = ( other ): number => {
		return ( other as HTMLElement ).id < node.id
			? node.DOCUMENT_POSITION_PRECEDING
			: node.DOCUMENT_POSITION_FOLLOWING;
	};
	const ref: React.MutableRefObject< HTMLElement | null > = createRef();
	ref.current = node;
	return ref;
}

function createItem( stem: string, index: number, groupId?: string ) {
	return {
		id: `${ stem }-${ index }`,
		ref: createItemRef( index ),
		groupId,
	};
}

function initialiseItems(
	context: CompositeStateReturn,
	stem = 'test',
	count = 3
) {
	act( () => {
		for ( let index = 1; index <= count; index++ ) {
			context.registerItem( createItem( stem, index ) );
		}
	} );
}

function initialiseGroups(
	context: CompositeStateReturn,
	stem = 'test',
	count = 3
) {
	act( () => {
		for ( let index = 1; index <= count; index++ ) {
			const id = `${ stem }-group-${ index }`;
			context.registerGroup( { id, ref: createRef() } );
			context.registerItem( createItem( stem, index, id ) );
		}
	} );
}

async function key( code: string, modifier?: string ) {
	if ( modifier ) {
		return await userEvent.keyboard(
			`[${ modifier }>][${ code }][/${ code }]`
		);
	}
	return await userEvent.keyboard( `[${ code }]` );
}

describe.each( Object.entries( COMPOSITE_SUITES ) )(
	'Validate %s implementation',
	( _, { Composite, CompositeGroup, CompositeItem, useCompositeState } ) => {
		function renderState( {
			baseId = DEFAULT_BASE_ID,
			...additionalState
		}: InitialState = {} ) {
			const initialState = { baseId, ...additionalState };
			return renderHook( () => useCompositeState( initialState ) ).result;
		}

		describe( 'API', () => {
			describe( 'State', () => {
				test( 'No initial state', () => {
					const state = renderState();
					expect( state.current ).toEqual( DEFAULT_STATE );
				} );

				test.each( [
					[ '`baseId`', { baseId: 'test' } ],
					[ '`currentId`', { currentId: 'test' } ],
					[ '`loop` [boolean]', { loop: true } ],
					[ '`loop` [horizontal]', { loop: 'horizontal' } ],
					[ '`loop` [vertical]', { loop: 'vertical' } ],
					[
						'`orientation` [horizontal]',
						{ orientation: 'horizontal' },
					],
					[ '`orientation` [vertical]', { orientation: 'vertical' } ],
					[ '`rtl`', { rtl: true } ],
					[ '`shift`', { shift: true } ],
					[ '`unstable_virtual`', { unstable_virtual: true } ],
					[ '`wrap` [boolean]', { wrap: true } ],
					[ '`wrap` [horizontal]', { wrap: 'horizontal' } ],
					[ '`wrap` [vertical]', { wrap: 'vertical' } ],
				] )( '%s', ( __, initialState ) => {
					const state = renderState( initialState as InitialState );

					expect( state.current ).toEqual( {
						...DEFAULT_STATE,
						...initialState,
					} );
				} );
			} );

			describe( 'Actions', () => {
				describe( 'Basic setters', () => {
					test( '`setBaseId`', () => {
						const state = renderState();
						act( () => state.current.setBaseId( 'test' ) );
						expect( state.current.baseId ).toBe( 'test' );
					} );

					test( '`setCurrentId`', () => {
						const state = renderState();
						act( () => state.current.setCurrentId( 'test' ) );
						expect( state.current.currentId ).toBe( 'test' );
					} );

					test( '`setLoop`', () => {
						const state = renderState();
						act( () => state.current.setLoop( true ) );
						expect( state.current.loop ).toBe( true );
					} );

					test( '`setOrientation`', () => {
						const state = renderState();
						act( () =>
							state.current.setOrientation( 'horizontal' )
						);
						expect( state.current.orientation ).toBe(
							'horizontal'
						);
					} );

					test( '`setRTL`', () => {
						const state = renderState();
						act( () => state.current.setRTL( true ) );
						expect( state.current.rtl ).toBe( true );
					} );

					test( '`setShift`', () => {
						const state = renderState();
						act( () => state.current.setShift( true ) );
						expect( state.current.shift ).toBe( true );
					} );

					test( '`setWrap`', () => {
						const state = renderState();
						act( () => state.current.setWrap( true ) );
						expect( state.current.wrap ).toBe( true );
					} );
				} );

				describe( 'Unstable setters', () => {
					test( '`unstable_setHasActiveWidget`', () => {
						const state = renderState();

						act( () =>
							state.current.unstable_setHasActiveWidget( true )
						);
						expect( state.current.unstable_hasActiveWidget ).toBe(
							true
						);

						act( () =>
							state.current.unstable_setHasActiveWidget( false )
						);
						expect( state.current.unstable_hasActiveWidget ).toBe(
							false
						);
					} );

					test( '`unstable_setIncludesBaseElement`', () => {
						const state = renderState();

						act( () =>
							state.current.unstable_setIncludesBaseElement(
								true
							)
						);
						expect(
							state.current.unstable_includesBaseElement
						).toBe( true );

						act( () =>
							state.current.unstable_setIncludesBaseElement(
								false
							)
						);
						expect(
							state.current.unstable_includesBaseElement
						).toBe( false );
					} );

					test( '`unstable_setVirtual`', () => {
						const state = renderState();

						act( () => state.current.unstable_setVirtual( true ) );
						expect( state.current.unstable_virtual ).toBe( true );

						act( () => state.current.unstable_setVirtual( false ) );
						expect( state.current.unstable_virtual ).toBe( false );
					} );
				} );

				describe( 'Registration handlers', () => {
					test( '`registerItem`', () => {
						const state = renderState();

						act( () =>
							state.current.registerItem( {
								id: 'test',
								ref: createRef(),
							} )
						);

						expect( state.current.items ).toMatchObject( [
							{ id: 'test' },
						] );
					} );

					test( '`registerGroup`', () => {
						const state = renderState();
						act( () =>
							state.current.registerGroup( {
								id: 'test',
								ref: createRef(),
							} )
						);

						expect( state.current.groups ).toMatchObject( [
							{ id: 'test' },
						] );
					} );
				} );

				describe( 'Movement', () => {
					test( '`move` [specified]', () => {
						const state = renderState();
						initialiseItems( state.current );
						act( () => state.current.move( 'test-2' ) );

						expect( state.current.currentId ).toBe( 'test-2' );
					} );

					test( '`move` [unspecified]', () => {
						const state = renderState();
						initialiseItems( state.current );
						act( () => state.current.move( null ) );

						expect( state.current.currentId ).toBe( null );
					} );

					test( '`first`', () => {
						const state = renderState();
						initialiseItems( state.current );
						act( () => state.current.first() );

						expect( state.current.currentId ).toBe( 'test-1' );
					} );

					test( '`last`', () => {
						const state = renderState();
						initialiseItems( state.current );
						act( () => state.current.last() );

						expect( state.current.currentId ).toBe( 'test-3' );
					} );

					test( '`previous`', () => {
						const state = renderState( {
							currentId: 'test-3',
						} );
						initialiseItems( state.current );
						act( () => state.current.previous() );

						expect( state.current.currentId ).toBe( 'test-2' );
					} );

					test( '`previous` [all the way]', () => {
						const state = renderState( {
							currentId: 'test-3',
						} );
						initialiseItems( state.current );
						act( () => state.current.previous( true ) );

						expect( state.current.currentId ).toBe( 'test-1' );
					} );

					test( '`next`', () => {
						const state = renderState( {
							currentId: 'test-1',
						} );
						initialiseItems( state.current );
						act( () => state.current.next() );

						expect( state.current.currentId ).toBe( 'test-2' );
					} );

					test( '`next` [all the way]', () => {
						const state = renderState( {
							currentId: 'test-1',
						} );
						initialiseItems( state.current );
						act( () => state.current.next( true ) );

						expect( state.current.currentId ).toBe( 'test-3' );
					} );

					test( '`up`', () => {
						const state = renderState( {
							currentId: 'test-3',
						} );
						initialiseGroups( state.current );
						act( () => state.current.up() );

						expect( state.current.currentId ).toBe( 'test-2' );
					} );

					test( '`up` [all the way]', () => {
						const state = renderState( {
							currentId: 'test-3',
						} );
						initialiseGroups( state.current );
						act( () => state.current.up( true ) );

						expect( state.current.currentId ).toBe( 'test-1' );
					} );

					test( '`down`', () => {
						const state = renderState( {
							currentId: 'test-1',
						} );
						initialiseGroups( state.current );
						act( () => state.current.down() );

						expect( state.current.currentId ).toBe( 'test-2' );
					} );

					test( '`down` [all the way]', () => {
						const state = renderState( {
							currentId: 'test-1',
						} );
						initialiseGroups( state.current );
						act( () => state.current.down( true ) );

						expect( state.current.currentId ).toBe( 'test-3' );
					} );
				} );

				describe( 'Other', () => {
					test( '`sort`', () => {
						const state = renderState();
						initialiseItems( state.current );

						expect( state.current.items ).toMatchObject( [
							{ id: 'test-1' },
							{ id: 'test-2' },
							{ id: 'test-3' },
						] );

						for ( const item of state.current.items ) {
							if ( item.ref.current ) {
								item.ref.current.id =
									'' +
									( 4 - parseInt( item.ref.current.id, 10 ) );
							}
						}

						act( () => state.current.sort() );

						expect( state.current.items ).toMatchObject( [
							{ id: 'test-3' },
							{ id: 'test-2' },
							{ id: 'test-1' },
						] );
					} );

					test( '`reset`', () => {
						const state = renderState();

						act( () => {
							state.current.setLoop( true );
							state.current.setCurrentId( 'test' );
						} );

						expect( state.current ).toMatchObject( {
							loop: true,
							currentId: 'test',
						} );

						act( () => state.current.reset() );

						expect( state.current ).toMatchObject( {
							loop: false,
							currentId: undefined,
						} );
					} );
				} );
			} );
		} );

		describe( 'Usage', () => {
			test( 'Renders as a single tab stop', async () => {
				const Test = () => {
					const composite = useCompositeState();
					return (
						<>
							<button>Before</button>
							<Composite { ...composite } aria-label="composite">
								<CompositeItem { ...composite }>
									Item 1
								</CompositeItem>
								<CompositeItem { ...composite }>
									Item 2
								</CompositeItem>
								<CompositeItem { ...composite }>
									Item 3
								</CompositeItem>
							</Composite>
							<button>After</button>
						</>
					);
				};
				render( <Test /> );

				await userEvent.tab();
				expect( screen.getByText( 'Before' ) ).toHaveFocus();
				await userEvent.tab();
				expect( screen.getByText( 'Item 1' ) ).toHaveFocus();
				await userEvent.tab();
				expect( screen.getByText( 'After' ) ).toHaveFocus();
				await userEvent.tab( { shift: true } );
				expect( screen.getByText( 'Item 1' ) ).toHaveFocus();
			} );

			test( 'Works in one dimension', async () => {
				const Test = () => {
					const composite = useCompositeState();
					return (
						<Composite { ...composite } aria-label="composite">
							<CompositeItem { ...composite }>
								Item 1
							</CompositeItem>
							<CompositeItem { ...composite }>
								Item 2
							</CompositeItem>
							<CompositeItem { ...composite }>
								Item 3
							</CompositeItem>
						</Composite>
					);
				};
				render( <Test /> );

				const item1 = screen.getByText( 'Item 1' );
				const item2 = screen.getByText( 'Item 2' );
				const item3 = screen.getByText( 'Item 3' );

				await userEvent.tab();
				expect( item1 ).toHaveFocus();
				await key( 'ArrowDown' );
				expect( item2 ).toHaveFocus();
				await key( 'ArrowDown' );
				expect( item3 ).toHaveFocus();
				await key( 'ArrowDown' );
				expect( item3 ).toHaveFocus();
				await key( 'ArrowUp' );
				expect( item2 ).toHaveFocus();
				await key( 'ArrowUp' );
				expect( item1 ).toHaveFocus();
				await key( 'ArrowUp' );
				expect( item1 ).toHaveFocus();
				await key( 'ArrowRight' );
				expect( item2 ).toHaveFocus();
				await key( 'ArrowRight' );
				expect( item3 ).toHaveFocus();
				await key( 'ArrowLeft' );
				expect( item2 ).toHaveFocus();
				await key( 'ArrowLeft' );
				expect( item1 ).toHaveFocus();
				await key( 'End' );
				expect( item3 ).toHaveFocus();
				await key( 'Home' );
				expect( item1 ).toHaveFocus();
				await key( 'PageDown' );
				expect( item3 ).toHaveFocus();
				await key( 'PageUp' );
				expect( item1 ).toHaveFocus();
			} );

			test( 'Works in two dimensions', async () => {
				const Test = () => {
					const composite = useCompositeState();

					return (
						<Composite { ...composite } aria-label="composite">
							<CompositeGroup { ...composite }>
								<CompositeItem { ...composite }>
									Item A1
								</CompositeItem>
								<CompositeItem { ...composite }>
									Item A2
								</CompositeItem>
								<CompositeItem { ...composite }>
									Item A3
								</CompositeItem>
							</CompositeGroup>
							<CompositeGroup { ...composite }>
								<CompositeItem { ...composite }>
									Item B1
								</CompositeItem>
								<CompositeItem { ...composite }>
									Item B2
								</CompositeItem>
								<CompositeItem { ...composite }>
									Item B3
								</CompositeItem>
							</CompositeGroup>
							<CompositeGroup { ...composite }>
								<CompositeItem { ...composite }>
									Item C1
								</CompositeItem>
								<CompositeItem { ...composite }>
									Item C2
								</CompositeItem>
								<CompositeItem { ...composite }>
									Item C3
								</CompositeItem>
							</CompositeGroup>
						</Composite>
					);
				};
				render( <Test /> );

				const itemA1 = screen.getByText( 'Item A1' );
				const itemA2 = screen.getByText( 'Item A2' );
				const itemA3 = screen.getByText( 'Item A3' );
				const itemB1 = screen.getByText( 'Item B1' );
				const itemB2 = screen.getByText( 'Item B2' );
				const itemC1 = screen.getByText( 'Item C1' );
				const itemC3 = screen.getByText( 'Item C3' );

				await userEvent.tab();
				expect( itemA1 ).toHaveFocus();
				await key( 'ArrowDown' );
				expect( itemB1 ).toHaveFocus();
				await key( 'ArrowRight' );
				expect( itemB2 ).toHaveFocus();
				await key( 'ArrowUp' );
				expect( itemA2 ).toHaveFocus();
				await key( 'ArrowLeft' );
				expect( itemA1 ).toHaveFocus();
				await key( 'End' );
				expect( itemA3 ).toHaveFocus();
				await key( 'PageDown' );
				expect( itemC3 ).toHaveFocus();
				await key( 'Home' );
				expect( itemC1 ).toHaveFocus();
				await key( 'PageUp' );
				expect( itemA1 ).toHaveFocus();
				await key( 'End', 'ControlLeft' );
				expect( itemC3 ).toHaveFocus();
				await key( 'Home', 'ControlLeft' );
				expect( itemA1 ).toHaveFocus();
			} );

			test( 'Ignores disabled items', async () => {
				const Test = () => {
					const composite = useCompositeState();
					return (
						<Composite { ...composite } aria-label="composite">
							<CompositeItem { ...composite }>
								Item 1
							</CompositeItem>
							<CompositeItem { ...composite } disabled>
								Item 2
							</CompositeItem>
							<CompositeItem { ...composite }>
								Item 3
							</CompositeItem>
						</Composite>
					);
				};
				render( <Test /> );

				const item1 = screen.getByText( 'Item 1' );
				const item2 = screen.getByText( 'Item 2' );
				const item3 = screen.getByText( 'Item 3' );

				expect( item2 ).toBeDisabled();

				await userEvent.tab();
				expect( item1 ).toHaveFocus();
				await key( 'ArrowDown' );
				expect( item2 ).not.toHaveFocus();
				expect( item3 ).toHaveFocus();
			} );

			test( 'Includes focusable disabled items', async () => {
				const Test = () => {
					const composite = useCompositeState();
					return (
						<Composite { ...composite } aria-label="composite">
							<CompositeItem { ...composite }>
								Item 1
							</CompositeItem>
							<CompositeItem { ...composite } disabled focusable>
								Item 2
							</CompositeItem>
							<CompositeItem { ...composite }>
								Item 3
							</CompositeItem>
						</Composite>
					);
				};
				render( <Test /> );

				const item1 = screen.getByText( 'Item 1' );
				const item2 = screen.getByText( 'Item 2' );
				const item3 = screen.getByText( 'Item 3' );

				expect( item2 ).toBeEnabled();
				expect( item2 ).toHaveAttribute( 'aria-disabled', 'true' );

				await userEvent.tab();
				expect( item1 ).toHaveFocus();
				await key( 'ArrowDown' );
				expect( item2 ).toHaveFocus();
				expect( item3 ).not.toHaveFocus();
			} );
		} );
	}
);
