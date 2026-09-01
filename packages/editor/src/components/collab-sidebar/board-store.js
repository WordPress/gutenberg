import { getNoteMarkerSelector, getSelectionRect } from './utils';

export function createBoardStore() {
	const listeners = new Set();
	const blockRefs = new Map();
	const floatingRefs = new Map();
	const idByElement = new WeakMap();
	const heights = {};
	let snapshot = {};

	function emit() {
		snapshot = { ...heights };
		for ( const listener of listeners ) {
			listener();
		}
	}

	const observer = new window.ResizeObserver( ( entries ) => {
		let changed = false;
		for ( const entry of entries ) {
			const id = idByElement.get( entry.target );
			const newHeight = entry.borderBoxSize[ 0 ].blockSize;
			if ( heights[ id ] !== newHeight ) {
				heights[ id ] = newHeight;
				changed = true;
			}
		}
		if ( changed ) {
			emit();
		}
	} );

	return {
		subscribe( listener ) {
			listeners.add( listener );
			return () => {
				listeners.delete( listener );
				if ( listeners.size === 0 ) {
					observer.disconnect();
				}
			};
		},

		getSnapshot() {
			return snapshot;
		},

		registerThread( id, blockEl, floatingEl ) {
			blockRefs.set( id, blockEl );
			const prev = floatingRefs.get( id );
			if ( prev && prev !== floatingEl ) {
				observer.unobserve( prev );
				idByElement.delete( prev );
			}
			if ( floatingEl ) {
				floatingRefs.set( id, floatingEl );
				idByElement.set( floatingEl, id );
				observer.observe( floatingEl );
			}
			emit();
		},

		unregisterThread( id ) {
			blockRefs.delete( id );
			const prev = floatingRefs.get( id );
			if ( prev ) {
				observer.unobserve( prev );
				idByElement.delete( prev );
				floatingRefs.delete( id );
			}
			delete heights[ id ];
		},

		getAnchorRects() {
			// Batch all rect reads before any writes to avoid layout thrashing.
			return Object.fromEntries(
				Array.from( blockRefs ).flatMap( ( [ id, el ] ) => {
					if ( ! el ) {
						return [];
					}
					// A pending new note has no in-content marker yet, so
					// anchor its form to the text selection it will attach
					// to; without a selection it stays on the block.
					if ( id === 'new' ) {
						const rect =
							getSelectionRect( el ) ??
							el.getBoundingClientRect();
						return [ [ id, rect ] ];
					}
					// An inline note anchors to its in-content marker so the
					// thread aligns with the noted text rather than the block.
					// Resolved at read time because rich-text re-renders
					// replace the marker element. A marker split into several
					// runs (crossing overlaps) resolves to its first run.
					const anchor =
						el.querySelector( getNoteMarkerSelector( id ) ) ?? el;
					return [ [ id, anchor.getBoundingClientRect() ] ];
				} )
			);
		},

		getFirstBlockElement() {
			return blockRefs.values().next().value ?? null;
		},
	};
}
