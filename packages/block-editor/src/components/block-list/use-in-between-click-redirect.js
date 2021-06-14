/**
 * WordPress dependencies
 */
import { useRefEffect } from '@wordpress/compose';
import { placeCaretAtVerticalEdge, focus } from '@wordpress/dom';

function isWithinRect( rect, x, y ) {
	return x > rect.left && x < rect.right && y > rect.top && y < rect.bottom;
}

function isWithinViewport( doc, x, y ) {
	const { defaultView } = doc;
	return (
		x > 0 &&
		x < defaultView.innerWidth &&
		y > 0 &&
		y < defaultView.innerHeight
	);
}

function getChildElementFromPoint( target, x, y, vector ) {
	const rect = target.getBoundingClientRect();
	let offset = 0;

	while ( ++offset ) {
		const _x = x + offset * vector[ 0 ];
		const _y = y + offset * vector[ 1 ];
		const { ownerDocument } = target;

		if (
			! isWithinRect( rect, _x, _y ) ||
			! isWithinViewport( ownerDocument, _x, _y )
		) {
			return;
		}

		const element = ownerDocument.elementFromPoint( _x, _y );

		if ( element !== target && target.contains( element ) ) {
			return [ element, offset ];
		}
	}
}

function getClosestChildElementFromPoint( target, x, y ) {
	const directions = [
		[ 1, 0 ],
		[ 0, 1 ],
		[ -1, 0 ],
		[ 0, -1 ],
	];

	let count = 0;
	let closestOffset;
	let closestElement;

	for ( const direction of directions ) {
		const result = getChildElementFromPoint( target, x, y, direction );

		if ( ! result ) {
			continue;
		}

		const [ element, offset ] = result;

		count++;

		if ( ! closestOffset || offset < closestOffset ) {
			closestOffset = offset;
			closestElement = element;
		}
	}

	if ( count < 2 ) {
		return;
	}

	return closestElement;
}

export function useInBetweenClickRedirect() {
	return useRefEffect( ( node ) => {
		function onMouseMove( event ) {
			const { clientX, clientY, target } = event;
			const closestElement = getClosestChildElementFromPoint(
				target,
				clientX,
				clientY
			);

			if ( ! closestElement ) {
				return;
			}

			const closestFocusableElement = closestElement.closest(
				focus.focusable.__unstableBuildSelector()
			);
			const isReverse =
				closestFocusableElement.getBoundingClientRect().bottom <
				clientY;
			const carectRect = new window.DOMRect( clientX, clientY, 0, 16 );

			placeCaretAtVerticalEdge(
				closestFocusableElement,
				isReverse,
				carectRect,
				false
			);
		}

		node.addEventListener( 'click', onMouseMove );

		return () => {
			node.removeEventListener( 'click', onMouseMove );
		};
	}, [] );
}
