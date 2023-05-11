/**
 * External dependencies
 */
import { useRef, useEffect } from 'preact/hooks';
import { effect } from '@preact/signals';

function afterNextFrame( callback ) {
	const done = () => {
		window.cancelAnimationFrame( raf );
		setTimeout( callback );
	};
	const raf = window.requestAnimationFrame( done );
}

// Using the mangled properties:
// this.c: this._callback
// this.x: this._compute
// https://github.com/preactjs/signals/blob/main/mangle.json
function createFlusher( compute, notify ) {
	let flush;
	const dispose = effect( function () {
		flush = this.c.bind( this );
		this.x = compute;
		this.c = notify;
		return compute();
	} );
	return { flush, dispose };
}

// Version of `useSignalEffect` with a `useEffect`-like execution. This hook
// implementation comes from this PR:
// https://github.com/preactjs/signals/pull/290.
//
// We need to include it here in this repo until the mentioned PR is merged.
export function useSignalEffect( cb ) {
	const callback = useRef( cb );
	callback.current = cb;

	useEffect( () => {
		const execute = () => callback.current();
		const notify = () => afterNextFrame( eff.flush );
		const eff = createFlusher( execute, notify );
		return eff.dispose;
	}, [] );
}

// For wrapperless hydration.
// See https://gist.github.com/developit/f4c67a2ede71dc2fab7f357f39cff28c
export const createRootFragment = ( parent, replaceNode ) => {
	replaceNode = [].concat( replaceNode );
	const s = replaceNode[ replaceNode.length - 1 ].nextSibling;
	function insert( c, r ) {
		parent.insertBefore( c, r || s );
	}
	return ( parent.__k = {
		nodeType: 1,
		parentNode: parent,
		firstChild: replaceNode[ 0 ],
		childNodes: replaceNode,
		insertBefore: insert,
		appendChild: insert,
		removeChild( c ) {
			parent.removeChild( c );
		},
	} );
};
