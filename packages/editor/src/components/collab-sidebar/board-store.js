import { getScrollContainer } from '@wordpress/dom';
import { getHiddenBlockAnchorRect, getNoteAnchorRect } from './utils';

const EMPTY_SNAPSHOT = {
	heights: {},
	anchorRects: {},
	canvas: null,
	frameOffset: 0,
	scrollbarWidth: 0,
};

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
 * after layout and before paint. Registering or unregistering a thread, or an
 * inline style change in the canvas, asks the observer for a new pass instead
 * of measuring directly. The observers only exist while the store has
 * subscribers.
 *
 * @return {Object} Store.
 */
export function createBoardStore() {
	const listeners = new Set();
	const blockRefs = new Map();
	const clientIds = new Map();
	const floatingRefs = new Map();
	const idByElement = new WeakMap();
	const heights = {};
	let rootEl = null;
	let canvas = null;
	let frameEl = null;
	let observer = null;
	let styleObserver = null;
	let blockOrder = [];
	let snapshot = EMPTY_SNAPSHOT;

	function measure() {
		// Anchors are stored in canvas content-space, so scrolling alone
		// never changes the snapshot.
		const scrollTop = canvas?.scrollTop ?? 0;
		const anchorRects = {};
		for ( const [ id, blockEl ] of blockRefs ) {
			// A block hidden at the current viewport renders nothing once it
			// is deselected. Anchor its threads to the place it would take.
			const rect = blockEl
				? getNoteAnchorRect( id, blockEl )
				: getHiddenBlockAnchorRect(
						clientIds.get( id ),
						blockOrder,
						( clientId ) =>
							rootEl?.ownerDocument.getElementById(
								`block-${ clientId }`
							) ?? null
					);
			if ( rect ) {
				anchorRects[ id ] = { top: rect.top + scrollTop };
			}
		}

		// Threads are positioned in their container, while anchors are read
		// in the canvas frame's viewport. Anything above the canvas (e.g. a
		// notice) moves the frame away from the container.
		const containerEl = [ ...floatingRefs.values() ][ 0 ]?.offsetParent;
		const frameOffset =
			frameEl && containerEl
				? frameEl.getBoundingClientRect().top -
					containerEl.getBoundingClientRect().top
				: 0;

		// The scrollbar toggles with the content height.
		const view = rootEl?.ownerDocument.defaultView;
		const scrollbarWidth = view
			? view.innerWidth - view.document.documentElement.clientWidth
			: 0;

		if (
			canvas === snapshot.canvas &&
			frameOffset === snapshot.frameOffset &&
			scrollbarWidth === snapshot.scrollbarWidth &&
			isSameHeights( heights, snapshot.heights ) &&
			isSameTops( anchorRects, snapshot.anchorRects )
		) {
			return;
		}

		snapshot = {
			heights: { ...heights },
			anchorRects,
			canvas,
			frameOffset,
			scrollbarWidth,
		};
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

	// The block move animation offsets blocks with a transform, which resizes
	// nothing. Measure once it clears, not on every animation frame.
	function onStyleChange( records ) {
		if ( records.some( ( { target } ) => ! target.style.transform ) ) {
			requestMeasure();
		}
	}

	// With every noted block hidden there is no block to climb from, so look
	// the root up from the threads' document. The canvas is iframed unless
	// something (e.g. meta boxes) forces same-document rendering.
	function findCanvasRoot() {
		const doc = [ ...floatingRefs.values() ][ 0 ]?.ownerDocument;
		if ( ! doc ) {
			return null;
		}
		const canvasDoc =
			doc.querySelector( 'iframe[name="editor-canvas"]' )
				?.contentDocument ?? doc;
		return canvasDoc.querySelector( '.is-root-container' );
	}

	// Watch the block-list root, so editing, adding or removing any block
	// re-anchors the threads after it. Climbing to the root also keeps nested
	// scroll containers (e.g. a Group with overflow:auto) from shadowing the
	// canvas.
	function syncRoot() {
		const blockEl = [ ...blockRefs.values() ].find( Boolean );
		const nextRootEl =
			blockEl?.closest( '.is-root-container' ) ??
			blockEl ??
			findCanvasRoot();
		if ( nextRootEl === rootEl ) {
			return;
		}
		rootEl = nextRootEl;
		canvas = rootEl ? getScrollContainer( rootEl ) : null;
		frameEl = rootEl?.ownerDocument.defaultView?.frameElement ?? null;
		// Root changes are rare, so start over rather than swap targets.
		if ( observer ) {
			disconnect();
			connect();
		}
	}

	function connect() {
		observer = new window.ResizeObserver( onResize );
		styleObserver = new window.MutationObserver( onStyleChange );
		const targets = [
			...floatingRefs.values(),
			rootEl,
			// Content above the root (e.g. the post title) moves it without
			// resizing it, but grows its parent.
			rootEl?.parentElement,
			// Content above the canvas moves the frame and shrinks it.
			frameEl,
		];
		for ( const target of targets ) {
			if ( target ) {
				observer.observe( target );
			}
		}
		if ( rootEl ) {
			styleObserver.observe( rootEl, {
				subtree: true,
				attributeFilter: [ 'style' ],
			} );
		}
	}

	function disconnect() {
		observer.disconnect();
		styleObserver.disconnect();
		observer = null;
		styleObserver = null;
	}

	function untrackFloating( id ) {
		const floatingEl = floatingRefs.get( id );
		if ( floatingEl ) {
			observer?.unobserve( floatingEl );
			idByElement.delete( floatingEl );
			floatingRefs.delete( id );
		}
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

		// Document order of every block, so a thread whose block isn't
		// rendered can be placed between the neighbours that are.
		setBlockOrder( clientIdsInOrder ) {
			if ( clientIdsInOrder !== blockOrder ) {
				blockOrder = clientIdsInOrder;
				requestMeasure();
			}
		},

		registerThread( id, blockEl, floatingEl, clientId ) {
			blockRefs.set( id, blockEl );
			clientIds.set( id, clientId );
			if ( floatingRefs.get( id ) !== floatingEl ) {
				untrackFloating( id );
				floatingRefs.set( id, floatingEl );
				idByElement.set( floatingEl, id );
				observer?.observe( floatingEl );
			}
			syncRoot();
			requestMeasure();
		},

		unregisterThread( id ) {
			blockRefs.delete( id );
			clientIds.delete( id );
			untrackFloating( id );
			delete heights[ id ];
			syncRoot();
			requestMeasure();
		},
	};
}
