import { getScrollContainer } from '@wordpress/dom';
import { getNoteAnchorRect } from './utils';

const EMPTY_SNAPSHOT = { heights: {}, anchorRects: {}, canvas: null };

function isSameTops( a, b ) {
	const keys = Object.keys( a );
	return (
		keys.length === Object.keys( b ).length &&
		keys.every( ( key ) => a[ key ]?.top === b[ key ]?.top )
	);
}

function isSameHeights( a, b ) {
	const keys = Object.keys( a );
	return (
		keys.length === Object.keys( b ).length &&
		keys.every( ( key ) => a[ key ] === b[ key ] )
	);
}

/**
 * Measures the floating notes layout inputs from the DOM.
 *
 * All DOM reads happen in one place, the `ResizeObserver` callback, which runs
 * after layout and before paint. Registering or unregistering a thread asks
 * the observer for a new pass instead of measuring directly. The observer only
 * exists while the store has subscribers.
 *
 * @return {Object} Store.
 */
export function createBoardStore() {
	const listeners = new Set();
	const blockRefs = new Map();
	const floatingRefs = new Map();
	const idByElement = new WeakMap();
	const heights = {};
	let rootEl = null;
	let canvas = null;
	let observer = null;
	let snapshot = EMPTY_SNAPSHOT;

	function measure() {
		// Anchors are stored in canvas content-space, so scrolling alone
		// never changes the snapshot.
		const scrollTop = canvas?.scrollTop ?? 0;
		const anchorRects = {};
		for ( const [ id, blockEl ] of blockRefs ) {
			if ( blockEl ) {
				const rect = getNoteAnchorRect( id, blockEl );
				anchorRects[ id ] = { top: rect.top + scrollTop };
			}
		}

		if (
			canvas === snapshot.canvas &&
			isSameHeights( heights, snapshot.heights ) &&
			isSameTops( anchorRects, snapshot.anchorRects )
		) {
			return;
		}

		snapshot = { heights: { ...heights }, anchorRects, canvas };
		for ( const listener of listeners ) {
			listener();
		}
	}

	function onResize( entries ) {
		for ( const entry of entries ) {
			const id = idByElement.get( entry.target );
			if ( id !== undefined ) {
				heights[ id ] = entry.borderBoxSize[ 0 ].blockSize;
			}
		}
		measure();
	}

	// A new observation always reports once, so re-observing the root makes
	// the observer run another pass before the next paint.
	function requestMeasure() {
		if ( ! observer ) {
			return;
		}
		if ( rootEl ) {
			observer.unobserve( rootEl );
			observer.observe( rootEl );
		} else {
			// Without a root there is nothing to read from the DOM.
			measure();
		}
	}

	// Watch the block-list root, so editing, adding or removing any block
	// re-anchors the threads after it. Climbing to the root also keeps nested
	// scroll containers (e.g. a Group with overflow:auto) from shadowing the
	// canvas.
	function syncRoot() {
		const blockEl = [ ...blockRefs.values() ].find( Boolean );
		const nextRootEl =
			blockEl?.closest( '.is-root-container' ) ?? blockEl ?? null;
		if ( nextRootEl === rootEl ) {
			return;
		}
		if ( observer && rootEl ) {
			observer.unobserve( rootEl );
		}
		rootEl = nextRootEl;
		canvas = rootEl ? getScrollContainer( rootEl ) : null;
		if ( observer && rootEl ) {
			observer.observe( rootEl );
		}
	}

	function connect() {
		observer = new window.ResizeObserver( onResize );
		for ( const floatingEl of floatingRefs.values() ) {
			observer.observe( floatingEl );
		}
		if ( rootEl ) {
			observer.observe( rootEl );
		}
	}

	function disconnect() {
		observer.disconnect();
		observer = null;
	}

	return {
		subscribe( listener ) {
			listeners.add( listener );
			if ( ! observer ) {
				connect();
			}
			return () => {
				listeners.delete( listener );
				if ( listeners.size === 0 ) {
					disconnect();
				}
			};
		},

		getSnapshot() {
			return snapshot;
		},

		requestMeasure,

		registerThread( id, blockEl, floatingEl ) {
			blockRefs.set( id, blockEl );
			const prev = floatingRefs.get( id );
			if ( prev && prev !== floatingEl ) {
				observer?.unobserve( prev );
				idByElement.delete( prev );
				floatingRefs.delete( id );
			}
			if ( floatingEl && prev !== floatingEl ) {
				floatingRefs.set( id, floatingEl );
				idByElement.set( floatingEl, id );
				observer?.observe( floatingEl );
			}
			syncRoot();
			requestMeasure();
		},

		unregisterThread( id ) {
			blockRefs.delete( id );
			const prev = floatingRefs.get( id );
			if ( prev ) {
				observer?.unobserve( prev );
				idByElement.delete( prev );
				floatingRefs.delete( id );
			}
			delete heights[ id ];
			syncRoot();
			requestMeasure();
		},
	};
}
