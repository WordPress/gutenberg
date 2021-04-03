/**
 * WordPress dependencies
 */
import { useRefEffect } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { toHTMLString } from '../to-html-string';
import { isCollapsed } from '../is-collapsed';
import { slice } from '../slice';
import { getTextContent } from '../get-text-content';

export function useCopyHandler( { record, multilineTag, preserveWhiteSpace } ) {
	return useRefEffect(
		( element ) => {
			function onCopy( event ) {
				if (
					isCollapsed( record.current ) ||
					! element.contains( element.ownerDocument.activeElement )
				) {
					return;
				}

				const selectedRecord = slice( record.current );
				const plainText = getTextContent( selectedRecord );
				const html = toHTMLString( {
					value: selectedRecord,
					multilineTag,
					preserveWhiteSpace,
				} );
				event.clipboardData.setData( 'text/plain', plainText );
				event.clipboardData.setData( 'text/html', html );
				event.clipboardData.setData( 'rich-text', 'true' );
				event.preventDefault();
			}

			element.addEventListener( 'copy', onCopy );
			return () => {
				element.removeEventListener( 'copy', onCopy );
			};
		},
		[ record, multilineTag, preserveWhiteSpace ]
	);
}
