/**
 * WordPress dependencies
 */
import { privateApis as composePrivateApis } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { toHTMLString } from '../../to-html-string';
import { isCollapsed } from '../../is-collapsed';
import { slice } from '../../slice';
import { remove } from '../../remove';
import { getTextContent } from '../../get-text-content';
import { unlock } from '../../lock-unlock';

const { subscribeDelegatedListener } = unlock( composePrivateApis );

export default ( props ) => ( element ) => {
	function onCopy( event ) {
		const { record, handleChange } = props.current;
		const { ownerDocument } = element;
		if (
			isCollapsed( record.current ) ||
			! element.contains( ownerDocument.activeElement )
		) {
			return;
		}

		const selectedRecord = slice( record.current );
		const plainText = getTextContent( selectedRecord );
		const html = toHTMLString( { value: selectedRecord } );
		event.clipboardData.setData( 'text/plain', plainText );
		event.clipboardData.setData( 'text/html', html );
		event.clipboardData.setData( 'rich-text', 'true' );
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
		defaultView,
		'copy',
		onCopy
	);
	const unsubscribeCut = subscribeDelegatedListener(
		defaultView,
		'cut',
		onCopy
	);
	return () => {
		unsubscribeCopy();
		unsubscribeCut();
	};
};
