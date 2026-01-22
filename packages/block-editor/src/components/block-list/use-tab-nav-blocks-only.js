/**
 * WordPress dependencies
 */
import { useRefEffect } from '@wordpress/compose';
import { TAB } from '@wordpress/keycodes';
import { focus } from '@wordpress/dom';

export function useTabNavBlocksOnly( isEnabled ) {
	return useRefEffect(
		( node ) => {
			if ( ! isEnabled ) {
				return;
			}

			function onKeyDown( event ) {
				if ( event.keyCode !== TAB ) {
					return;
				}

				// Get all tabbable elements and filter to blocks only
				const allTabbables = focus.tabbable.find( node );
				const blockTabbables = allTabbables.filter( ( el ) =>
					el.hasAttribute( 'data-block' )
				);

				if ( ! blockTabbables.length ) {
					return;
				}

				const currentIndex = blockTabbables.indexOf(
					event.target.closest( '[data-block]' )
				);

				let nextIndex;
				if ( event.shiftKey ) {
					// Shift+Tab: go backward, wrap to end
					nextIndex =
						currentIndex <= 0
							? blockTabbables.length - 1
							: currentIndex - 1;
				} else {
					// Tab: go forward, wrap to start
					nextIndex =
						currentIndex >= blockTabbables.length - 1
							? 0
							: currentIndex + 1;
				}

				event.preventDefault();
				blockTabbables[ nextIndex ].focus();
			}

			node.addEventListener( 'keydown', onKeyDown );
			return () => {
				node.removeEventListener( 'keydown', onKeyDown );
			};
		},
		[ isEnabled ]
	);
}
