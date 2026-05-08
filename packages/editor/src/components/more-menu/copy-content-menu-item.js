/**
 * WordPress dependencies
 */
import { MenuItem } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { useCopyToClipboard } from '@wordpress/compose';
import { store as noticesStore } from '@wordpress/notices';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';

export default function CopyContentMenuItem() {
	const { createNotice } = useDispatch( noticesStore );
	const { getEditedPostContent, getEditedPostAttribute } =
		useSelect( editorStore );

	function enrichCopiedContentWithFootnotes( copiedContent ) {
		const meta = getEditedPostAttribute( 'meta' );
		const serializedFootnotes = meta?.footnotes;
		if ( ! serializedFootnotes ) {
			return copiedContent;
		}

		let footnotes;
		try {
			footnotes = JSON.parse( serializedFootnotes );
		} catch {
			return copiedContent;
		}

		if ( ! Array.isArray( footnotes ) || ! footnotes.length ) {
			return copiedContent;
		}

		const footnotesById = footnotes.reduce( ( acc, footnote ) => {
			if ( footnote?.id && typeof footnote.content === 'string' ) {
				acc[ footnote.id ] = footnote.content;
			}
			return acc;
		}, {} );

		if ( Object.keys( footnotesById ).length === 0 ) {
			return copiedContent;
		}

		const encodeAttribute = ( value ) =>
			String( value )
				.replaceAll( '&', '&amp;' )
				.replaceAll( '"', '&quot;' )
				.replaceAll( '<', '&lt;' )
				.replaceAll( '>', '&gt;' );

		return copiedContent.replace(
			/<sup\b[^>]*\bdata-fn="([^"]+)"[^>]*>/g,
			( supTag, id ) => {
				const content = footnotesById[ id ];
				if ( ! content ) {
					return supTag;
				}

				const encodedContent = encodeAttribute( content );

				if ( /\bdata-fn-content="[^"]*"/.test( supTag ) ) {
					return supTag.replace(
						/\bdata-fn-content="[^"]*"/,
						`data-fn-content="${ encodedContent }"`
					);
				}

				return supTag.replace(
					'<sup',
					`<sup data-fn-content="${ encodedContent }"`
				);
			}
		);
	}

	function getText() {
		const copiedContent = enrichCopiedContentWithFootnotes(
			getEditedPostContent()
		);
		return copiedContent;
	}

	function onSuccess() {
		createNotice( 'info', __( 'All content copied.' ), {
			isDismissible: true,
			type: 'snackbar',
		} );
	}

	const ref = useCopyToClipboard( getText, onSuccess );

	return <MenuItem ref={ ref }>{ __( 'Copy all blocks' ) }</MenuItem>;
}
