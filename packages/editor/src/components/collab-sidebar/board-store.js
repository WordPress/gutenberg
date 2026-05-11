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

		getBlockRects() {
			// Batch all rect reads before any writes to avoid layout thrashing.
			return Object.fromEntries(
				Array.from( blockRefs ).flatMap( ( [ id, el ] ) =>
					el ? [ [ id, el.getBoundingClientRect() ] ] : []
				)
			);
		},

		getFirstBlockElement() {
			return blockRefs.values().next().value ?? null;
		},
	};
}
