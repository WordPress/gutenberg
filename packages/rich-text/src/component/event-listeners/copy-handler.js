/**
 * Internal dependencies
 */
import { toHTMLString } from '../../to-html-string';
import { slice } from '../../slice';
import { remove } from '../../remove';
import { getTextContent } from '../../get-text-content';

export default ( props ) => ( element ) => {
	function onCopy( event ) {
		const { record, createRecord, handleChange } = props.current;
		const { ownerDocument } = element;
		const { defaultView } = ownerDocument;
		const { anchorNode, focusNode, isCollapsed } =
			defaultView.getSelection();
		const containsSelection =
			element.contains( anchorNode ) && element.contains( focusNode );

		if ( isCollapsed || ! containsSelection ) {
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
			handleChange( remove( createRecord() ) );
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
