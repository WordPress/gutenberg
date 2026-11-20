import { beforeEach, describe, expect, it, vi } from 'vitest';

let mockStore;
let mockContext;

vi.mock( import( '@wordpress/interactivity' ), () => ( {
	store: ( name, config ) => {
		mockStore = config;
		return config;
	},
	getContext: () => mockContext,
	getElement: () => ( { attributes: { id: document.activeElement.id } } ),
	withSyncEvent: ( callback ) => callback,
} ) );

describe( 'Tabs keyboard navigation', () => {
	beforeEach( async () => {
		vi.resetModules();
		mockContext = { tabsId: 'example', activeTabIndex: 0 };
		document.body.innerHTML = [ 0, 1, 2 ]
			.map( ( index ) => `<button id="tab__panel-${ index }"></button>` )
			.join( '' );
		await import( '../view' );
		mockStore.state.example = [ 'panel-0', 'panel-1', 'panel-2' ];
	} );

	it.each( [ undefined, false, true ] )(
		'navigates with autoActivate set to %s',
		( autoActivate ) => {
			mockContext.autoActivate = autoActivate;
			const tabs = document.querySelectorAll( 'button' );
			tabs[ 0 ].focus();

			for ( const [ key, index ] of [
				[ 'ArrowRight', 1 ],
				[ 'ArrowRight', 2 ],
				[ 'ArrowRight', 0 ],
				[ 'ArrowLeft', 2 ],
				[ 'ArrowLeft', 1 ],
				[ 'Home', 0 ],
				[ 'End', 2 ],
			] ) {
				const event = new window.KeyboardEvent( 'keydown', {
					key,
					cancelable: true,
				} );
				mockStore.actions.handleTabKeyDown( event );
				expect( event.defaultPrevented ).toBe( true );
				expect( tabs[ index ] ).toHaveFocus();
				expect( mockContext.activeTabIndex ).toBe(
					autoActivate ? index : 0
				);
			}
		}
	);

	it.each( [ 'ArrowUp', 'ArrowDown', 'Tab', 'Escape' ] )(
		'leaves %s to the browser',
		( key ) => {
			mockContext.autoActivate = true;
			const tab = document.querySelectorAll( 'button' )[ 1 ];
			tab.focus();
			const event = new window.KeyboardEvent( 'keydown', {
				key,
				cancelable: true,
			} );
			mockStore.actions.handleTabKeyDown( event );
			expect( event.defaultPrevented ).toBe( false );
			expect( tab ).toHaveFocus();
			expect( mockContext.activeTabIndex ).toBe( 0 );
		}
	);
} );
