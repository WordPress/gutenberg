import { privateApis as composePrivateApis } from '@wordpress/compose';
import type { RefObject } from 'react';
import { unlock } from '../../../lock-unlock';

const { useDelegatedListeners } = unlock( composePrivateApis );

const timeouts = new WeakMap< HTMLElement, ReturnType< typeof setTimeout > >();

function listener(
	{
		element: node,
		props,
	}: { element: HTMLElement; props: RefObject< { isEnabled: boolean } > },
	event: MouseEvent
) {
	// Remove classes in case they linger.
	if ( ! props.current.isEnabled ) {
		clearTimeout( timeouts.get( node ) );
		node.classList.remove( 'is-hovered' );
		node.classList.remove( 'is-hovered-draggable' );
		return;
	}
	if ( event.defaultPrevented ) {
		return;
	}
	event.preventDefault();
	const isHovered = event.type === 'mouseover';
	node.classList.toggle( 'is-hovered', isHovered );
	clearTimeout( timeouts.get( node ) );
	if ( ! isHovered ) {
		node.classList.remove( 'is-hovered-draggable' );
		return;
	}
	// Over editable content the cursor is a text cursor, not
	// the grab cursor, so no drag would start there. The
	// editability check can force a style recalculation, so it
	// runs once the pointer rests, which also keeps the
	// outline from flashing on blocks it merely passes over.
	// Mouse events target elements.
	const target = event.target as HTMLElement;
	timeouts.set(
		node,
		setTimeout( () => {
			node.classList.toggle(
				'is-hovered-draggable',
				! target.isContentEditable
			);
		}, 100 )
	);
}

const listeners = {
	default: {
		mouseout: { target: [ listener ] },
		mouseover: { target: [ listener ] },
	},
};

/**
 * Adds `is-hovered` class when the block is hovered and in navigation or
 * outline mode.
 *
 * @param options           Options object.
 * @param options.isEnabled Whether to enable hover detection.
 *
 * @return Ref callback.
 */
export function useIsHovered( {
	isEnabled = true,
}: { isEnabled?: boolean } = {} ) {
	return useDelegatedListeners( listeners, { isEnabled } );
}
