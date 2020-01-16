/**
 * A function which accepts a callback, calling the callback at the earliest
 * free moment, using `requestIdleCallback` if available, falling back to
 * `setTimeout`.
 *
 * @type {(callback:()=>void)=>void}
 */
const withIdleCallback = typeof window !== 'undefined' && 'requestIdleCallback' in window ?
	( callback ) => void window.requestIdleCallback( () => callback() ) :
	( callback ) => void setTimeout( callback, 0 );

export default withIdleCallback;
