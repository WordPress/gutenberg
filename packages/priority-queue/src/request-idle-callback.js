/**
 * @return {typeof window.requestIdleCallback|typeof window.requestAnimationFrame|((callback:(timestamp:number)=>void)=>void)}
 */
export function createRequestIdleCallback() {
	if ( typeof 'window' === undefined ) {
		return ( callback ) => {
			setTimeout( () => callback( Date.now() ), 0 );
		};
	}

	return window.requestIdleCallback || window.requestAnimationFrame;
}

export default createRequestIdleCallback();
