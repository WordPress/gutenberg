/**
 * Internal dependencies
 */
import { toHTMLString } from '../../to-html-string';
import { isCollapsed } from '../../is-collapsed';
import { slice } from '../../slice';
import { getTextContent } from '../../get-text-content';

export default ( props ) => ( element ) => {
	function onCopy( event ) {
		const { record } = props.current;
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
			ownerDocument.execCommand( 'delete' );
		}
	}

	const { defaultView } = element.ownerDocument;

	defaultView.addEventListener( 'copy', onCopy );
	defaultView.addEventListener( 'cut', onCopy );
	return () => {
		defaultView.removeEventListener( 'copy', onCopy );
		defaultView.removeEventListener( 'cut', onCopy );
	};
};
