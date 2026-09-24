import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getScrollContainer } from '@wordpress/dom';
import { createBoardStore } from '../board-store';

vi.mock( '@wordpress/dom', () => ( { getScrollContainer: vi.fn() } ) );

let observers;

class FakeResizeObserver {
	constructor( callback ) {
		this.callback = callback;
		this.targets = new Set();
		observers.push( this );
	}
	observe( target ) {
		this.targets.add( target );
	}
	unobserve( target ) {
		this.targets.delete( target );
	}
	disconnect() {
		this.targets.clear();
	}
}

// Like the browser, only observers watching the element are notified.
function resize( target, blockSize ) {
	for ( const observer of observers ) {
		if ( observer.targets.has( target ) ) {
			observer.callback( [
				{ target, borderBoxSize: [ { blockSize } ] },
			] );
		}
	}
}

describe( 'createBoardStore', () => {
	beforeEach( () => {
		observers = [];
		vi.mocked( getScrollContainer ).mockReturnValue( { scrollTop: 0 } );
		vi.stubGlobal( 'ResizeObserver', FakeResizeObserver );
	} );

	afterEach( () => {
		vi.unstubAllGlobals();
	} );

	// StrictMode unsubscribes and resubscribes on mount; CI e2e runs
	// without it.
	it( 'keeps measuring after resubscribing', () => {
		const store = createBoardStore();
		const root = document.createElement( 'div' );
		root.className = 'is-root-container';
		const blockEl = document.createElement( 'p' );
		root.appendChild( blockEl );
		blockEl.getBoundingClientRect = () => ( { top: 100 } );
		const floatingEl = document.createElement( 'div' );

		const unsubscribe = store.subscribe( () => {} );
		store.registerThread( 1, blockEl, floatingEl );
		unsubscribe();
		const listener = vi.fn();
		store.subscribe( listener );

		resize( floatingEl, 80 );

		expect( listener ).toHaveBeenCalled();
		expect( store.getSnapshot().heights ).toEqual( { 1: 80 } );
	} );
} );
