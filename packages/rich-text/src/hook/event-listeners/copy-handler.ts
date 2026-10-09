import { privateApis as composePrivateApis } from '@wordpress/compose';
import { toHTMLString } from '../../to-html-string';
import { isCollapsed } from '../../is-collapsed';
import { slice } from '../../slice';
import { remove } from '../../remove';
import { getTextContent } from '../../get-text-content';
import { ownsSelection } from '../../owns-selection';
import { unlock } from '../../lock-unlock';
import type { EventListenerEffect } from '../types';

const { subscribeDelegatedListener } = unlock( composePrivateApis );

const copyHandler: EventListenerEffect = ( props ) => ( element ) => {
	function onCopy( event: ClipboardEvent ) {
		const { record, handleChange } = props.current;
		const { ownerDocument } = element;
		if (
			// Another handler may have already claimed the clipboard, e.g.
			// the block editor copying the whole block when its entire
			// text is selected.
			event.defaultPrevented ||
			isCollapsed( record.current ) ||
			( ! element.contains( ownerDocument.activeElement ) &&
				! ownsSelection( element ) )
		) {
			return;
		}

		const selectedRecord = slice( record.current );
		const plainText = getTextContent( selectedRecord );
		const html = toHTMLString( { value: selectedRecord } );
		event.clipboardData!.setData( 'text/plain', plainText );
		event.clipboardData!.setData( 'text/html', html );
		event.clipboardData!.setData( 'rich-text', 'true' );
		event.preventDefault();

		if ( event.type === 'cut' ) {
			// Remove the selection through the record rather than the
			// deprecated `execCommand( 'delete' )`. The record is
			// synchronized on capture of the `cut` event, and `handleChange`
			// processes the removal like any input.
			handleChange( remove( record.current ) );
		}
	}

	const { defaultView } = element.ownerDocument;
	const unsubscribeCopy = subscribeDelegatedListener(
		defaultView!,
		'copy',
		onCopy as EventListener
	);
	const unsubscribeCut = subscribeDelegatedListener(
		defaultView!,
		'cut',
		onCopy as EventListener
	);
	return () => {
		unsubscribeCopy();
		unsubscribeCut();
	};
};

export default copyHandler;
