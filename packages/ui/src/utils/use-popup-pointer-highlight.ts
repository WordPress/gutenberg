import { useState } from '@wordpress/element';
import type { FocusEvent, KeyboardEvent } from 'react';

/**
 * Native focus-visible can persist when a composite moves focus on hover.
 * Track pointer interaction within the popup until keyboard navigation resumes.
 */
export function usePopupPointerHighlight() {
	const [ pointerHighlight, setPointerHighlight ] = useState( false );

	return {
		'data-pointer-highlight': pointerHighlight ? '' : undefined,
		onKeyDownCapture: ( event: KeyboardEvent< HTMLElement > ) => {
			if (
				! [ 'Shift', 'Control', 'Alt', 'Meta' ].includes( event.key )
			) {
				setPointerHighlight( false );
			}
		},
		onPointerMoveCapture: () => setPointerHighlight( true ),
		onPointerDownCapture: () => setPointerHighlight( true ),
		onBlurCapture: ( event: FocusEvent< HTMLElement > ) => {
			if ( ! event.currentTarget.contains( event.relatedTarget ) ) {
				setPointerHighlight( false );
			}
		},
	};
}
