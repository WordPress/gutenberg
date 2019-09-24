/**
 * External dependencies
 */
import { useContext, useEffect } from 'react';
import { __RouterContext as RouterContext } from 'react-router-dom';
import scrollIntoViewIfNeeded from 'scroll-into-view-if-needed';

export { useData } from './use-data.hooks';

export function useClearSelection() {
	useEffect( () => {
		const sel = window.getSelection ? window.getSelection() : document.selection;
		if ( sel ) {
			if ( sel.removeAllRanges ) {
				sel.removeAllRanges();
			} else if ( sel.empty ) {
				sel.empty();
			}
		}
	}, [] );
}

export function useClearTimeout( timeout ) {
	useEffect( () => {
		return () => {
			window.clearTimeout( timeout );
		};
	}, [ timeout ] );
}

export function useFocusNodeById( id ) {
	useEffect( () => {
		if ( ! id ) {
			return;
		}
		window.requestAnimationFrame( () => {
			const node = document.getElementById( id );
			if ( node ) {
				node.focus();
			}
		} );
	}, [ id ] );
}

export function useRouter() {
	return useContext( RouterContext );
}

export function useScrollToTop( prop ) {
	useClearSelection();
	useEffect( () => {
		window.scrollTo( 0, 0 );
	}, [ prop ] );
}

export function useScrollIntoView( selector ) {
	useEffect( () => {
		const options = {
			behavior: 'smooth',
			scrollMode: 'if-needed',
		};

		let node = selector;
		if ( typeof selector === 'string' ) {
			node = document.querySelector( selector );
		}

		if ( node ) {
			scrollIntoViewIfNeeded( node, options );
		}
	}, [ selector ] );
}
