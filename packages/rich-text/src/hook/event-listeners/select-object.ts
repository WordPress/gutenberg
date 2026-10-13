import { privateApis as composePrivateApis } from '@wordpress/compose';
import { unlock } from '../../lock-unlock';
import type { EventListenerEffect } from '../types';

const { subscribeDelegatedListener } = unlock( composePrivateApis );

const selectObject: EventListenerEffect = () => ( element ) => {
	function onClick( event: Event ) {
		const target = event.target as HTMLElement;

		// If the child element has no text content, it must be an object.
		if (
			target === element ||
			( target.textContent && target.isContentEditable )
		) {
			return;
		}

		const { ownerDocument } = target;
		const { defaultView } = ownerDocument;
		const selection = defaultView!.getSelection()!;

		// If it's already selected, do nothing and let default behavior happen.
		// This means it's "click-through".
		if ( selection.containsNode( target ) ) {
			return;
		}

		const range = ownerDocument.createRange();
		// If the target is within a non editable element, select the non
		// editable element.
		const nodeToSelect = target.isContentEditable
			? target
			: target.closest( '[contenteditable]' );

		range.selectNode( nodeToSelect! );
		selection.removeAllRanges();
		selection.addRange( range );

		event.preventDefault();
	}

	function onFocusIn( event: FocusEvent ) {
		// When focus moves into the element and lands on a nested
		// non-editable child (e.g. fragment navigation to a footnote
		// marker), select the object. The focus source may be a link, or
		// an editing host in between (links are not mouse focusable within
		// an editable context, so the source link never receives focus
		// when the editor canvas is an editing host).
		if (
			event.relatedTarget &&
			! element.contains( event.relatedTarget as Node )
		) {
			onClick( event );
		}
	}

	const unsubscribeClick = subscribeDelegatedListener(
		element,
		'click',
		onClick
	);
	const unsubscribeFocusIn = subscribeDelegatedListener(
		element,
		'focusin',
		onFocusIn as EventListener
	);
	return () => {
		unsubscribeClick();
		unsubscribeFocusIn();
	};
};

export default selectObject;
