/**
 * WordPress dependencies
 */
import { pasteHandler } from '@wordpress/blocks';
import { isEmpty, insert, create } from '@wordpress/rich-text';
import { isURL } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { addActiveFormats } from '../utils';
import { getPasteEventData } from '../../../utils/pasting';

/** @typedef {import('@wordpress/rich-text').RichTextValue} RichTextValue */

export default ( props ) => ( element ) => {
	function _onPaste( event ) {
		const {
			disableFormats,
			onChange,
			value,
			formatTypes,
			tagName,
			onReplace,
			__unstableEmbedURLOnPaste,
			preserveWhiteSpace,
			pastePlainText,
		} = props.current;

		// The event listener is attached to the window, so we need to check if
		// the target is the element or inside the element.
		if ( ! element.contains( event.target ) ) {
			return;
		}

		if ( event.defaultPrevented ) {
			return;
		}

		const { plainText, html } = getPasteEventData( event );

		event.preventDefault();

		// Allows us to ask for this information when we get a report.
		window.console.log( 'Received HTML:\n\n', html );
		window.console.log( 'Received plain text:\n\n', plainText );

		if ( disableFormats ) {
			onChange( insert( value, plainText ) );
			return;
		}

		const isInternal =
			event.clipboardData.getData( 'rich-text' ) === 'true';

		function pasteInline( content ) {
			const transformed = formatTypes.reduce(
				( accumulator, { __unstablePasteRule } ) => {
					// Only allow one transform.
					if ( __unstablePasteRule && accumulator === value ) {
						accumulator = __unstablePasteRule( value, {
							html,
							plainText,
						} );
					}

					return accumulator;
				},
				value
			);
			if ( transformed !== value ) {
				onChange( transformed );
			} else {
				const valueToInsert = create( { html: content } );
				addActiveFormats( valueToInsert, value.activeFormats );
				onChange( insert( value, valueToInsert ) );
			}
		}

		// If the data comes from a rich text instance, we can directly use it
		// without filtering the data. The filters are only meant for externally
		// pasted content and remove inline styles.
		if ( isInternal ) {
			pasteInline( html );
			return;
		}

		if ( pastePlainText ) {
			onChange( insert( value, create( { text: plainText } ) ) );
			return;
		}

		let mode = 'INLINE';

		const trimmedPlainText = plainText.trim();

		if (
			__unstableEmbedURLOnPaste &&
			isEmpty( value ) &&
			isURL( trimmedPlainText ) &&
			// For the link pasting feature, allow only http(s) protocols.
			/^https?:/.test( trimmedPlainText )
		) {
			mode = 'BLOCKS';
		}

		const content = pasteHandler( {
			HTML: html,
			plainText,
			mode,
			tagName,
			preserveWhiteSpace,
		} );

		if ( typeof content === 'string' ) {
			pasteInline( content );
		} else if ( content.length > 0 ) {
			if ( onReplace && isEmpty( value ) ) {
				onReplace( content, content.length - 1, -1 );
			}
		}
	}

	const { defaultView } = element.ownerDocument;

	// Attach the listener to the window so parent elements have the chance to
	// prevent the default behavior.
	defaultView.addEventListener( 'paste', _onPaste );
	return () => {
		defaultView.removeEventListener( 'paste', _onPaste );
	};
};
