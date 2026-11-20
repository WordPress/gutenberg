/**
 * WordPress dependencies
 */
import { useEffect, useLayoutEffect, useRef } from '@wordpress/element';

type Callback = ( entry: ResizeObserverEntry ) => void;
type CallbackProps< T > = ResizeObserverSize & { target: T };

export default function useResizeObserver< T extends Element >(
	target: React.RefObject< T > | T | null,
	callback: ( { blockSize, inlineSize, target }: CallbackProps< T > ) => void,
	dependencies?: React.DependencyList | undefined
) {
	const resizeObserver = getResizeObserver();
	const storedCallback = useLatest( callback );

	useLayoutEffect( () => {
		const element = target && 'current' in target ? target.current : target;
		if ( ! element ) return;

		let subscribed = true;

		const handler = ( entry: ResizeObserverEntry ) => {
			if ( ! subscribed ) return;
			const { contentBoxSize, contentRect } = entry;
			const { current: cb } = storedCallback;
			let size: ResizeObserverSize;

			if ( contentBoxSize ) {
				if ( contentBoxSize[ 0 ] ) {
					// This is the standard
					size = contentBoxSize[ 0 ];
				} else {
					// This is how it used to be implemented
					size = contentBoxSize as unknown as ResizeObserverSize;
				}
			} else {
				size = {
					blockSize: contentRect.height,
					inlineSize: contentRect.width,
				};
			}

			cb( {
				blockSize: size.blockSize,
				inlineSize: size.inlineSize,
				target: element,
			} );
		};

		resizeObserver.subscribe( element, handler );

		return () => {
			subscribed = false;
			resizeObserver.unsubscribe( element, handler );
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, dependencies );
}

const useLatest = < T extends any >( current: T ) => {
	const storedValue = useRef( current );
	useEffect( () => {
		storedValue.current = current;
	} );
	return storedValue;
};

let _resizeObserver: {
	observer: ResizeObserver | null;
	subscribe: ( target: Element, callback: Callback ) => void;
	unsubscribe: ( target: Element, callback: Callback ) => void;
};

function getResizeObserver() {
	return _resizeObserver ?? ( _resizeObserver = createResizeObserver() );
}

function createResizeObserver() {
	const ResizeObserver =
		// eslint-disable-next-line ssr-friendly/no-dom-globals-in-module-scope
		typeof window !== 'undefined' && 'ResizeObserver' in window
			? // @ts-ignore
			  // eslint-disable-next-line ssr-friendly/no-dom-globals-in-module-scope
			  window.ResizeObserver
			: null;

	if ( ! ResizeObserver ) {
		return { observer: null, subscribe: () => {}, unsubscribe: () => {} };
	}

	let ticking = false;
	let allEntries: ResizeObserverEntry[] = [];
	const callbacks: WeakMap< Element, Array< Callback > > = new WeakMap();

	const observer = new ResizeObserver( ( entries: ResizeObserverEntry[] ) => {
		allEntries = allEntries.concat( entries );

		if ( ! ticking ) {
			window.requestAnimationFrame( () => {
				const triggered = new Set< Element >();
				for ( let i = 0; i < allEntries.length; i++ ) {
					const entry = allEntries[ i ];
					const { target } = entry;
					if ( triggered.has( target ) ) continue;

					triggered.add( target );
					callbacks
						.get( target )
						?.forEach( ( callback ) => callback( entry ) );
				}
				allEntries = [];
				ticking = false;
			} );
		}

		ticking = true;
	} );

	return {
		observer,
		subscribe( target: Element, callback: Callback ) {
			observer.observe( target );
			const targetCallbacks = callbacks.get( target ) ?? [];
			targetCallbacks.push( callback );
			callbacks.set( target, targetCallbacks );
		},
		unsubscribe( target: Element, callback: Callback ) {
			const targetCallbacks = callbacks.get( target ) ?? [];
			if ( targetCallbacks.length === 1 ) {
				observer.unobserve( target );
				callbacks.delete( target );
				return;
			}
			const callbackIndex = targetCallbacks.indexOf( callback );
			if ( callbackIndex !== -1 )
				targetCallbacks.splice( callbackIndex, 1 );
			callbacks.set( target, targetCallbacks );
		},
	};
}
