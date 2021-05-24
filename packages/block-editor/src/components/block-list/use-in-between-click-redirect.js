/**
 * WordPress dependencies
 */
import { useRefEffect } from '@wordpress/compose';
import { placeCaretAtVerticalEdge } from '@wordpress/dom';

/**
 * Internal dependencies
 */
import { getClosestTabbable } from '../../components/writing-flow/use-arrow-nav';

export function useInBetweenClickRedirect() {
	return useRefEffect( ( node ) => {
		function onMouseMove( event ) {
			const { clientX, clientY, target } = event;

			if ( target !== node ) {
				return;
			}

			const { children } = node;
			const rect = node.getBoundingClientRect();
			const offsetTop = clientY - rect.top;

			let beforeChild;
			let afterChild;

			for ( const child of children ) {
				if ( child.offsetTop > offsetTop ) {
					afterChild = child;
					break;
				} else {
					beforeChild = child;
				}
			}

			let isReverse;

			if ( ! beforeChild ) {
				isReverse = false;
			} else if ( ! afterChild ) {
				isReverse = true;
			} else {
				const beforeY = beforeChild.getBoundingClientRect().bottom;
				const afterY = afterChild.getBoundingClientRect().top;
				isReverse = clientY - beforeY < afterY - clientY;
			}

			const container = isReverse ? node : afterChild;
			const closest =
				getClosestTabbable( afterChild, true, container ) || afterChild;

			const carectRect = new window.DOMRect( clientX, clientY, 0, 16 );

			placeCaretAtVerticalEdge( closest, isReverse, carectRect, false );
		}

		node.addEventListener( 'click', onMouseMove );

		return () => {
			node.removeEventListener( 'click', onMouseMove );
		};
	}, [] );
}
