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

		if ( event.target !== element ) {
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

		const transformed = formatTypes.reduce(
			( accumlator, { __unstablePasteRule } ) => {
				// Only allow one transform.
				if ( __unstablePasteRule && accumlator === value ) {
					accumlator = __unstablePasteRule( value, {
						html,
						plainText,
					} );
				}

				return accumlator;
			},
			value
		);

		if ( transformed !== value ) {
			onChange( transformed );
			return;
		}

		const isInternal =
			event.clipboardData.getData( 'rich-text' ) === 'true';

		// If the data comes from a rich text instance, we can directly use it
		// without filtering the data. The filters are only meant for externally
		// pasted content and remove inline styles.
		if ( isInternal ) {
			const pastedValue = create( {
				html,
				preserveWhiteSpace,
			} );
			addActiveFormats( pastedValue, value.activeFormats );
			onChange( insert( value, pastedValue ) );
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
			const valueToInsert = create( { html: content } );
			addActiveFormats( valueToInsert, value.activeFormats );
			onChange( insert( value, valueToInsert ) );
		} else if ( content.length > 0 ) {
			if ( onReplace && isEmpty( value ) ) {
				onReplace( content, content.length - 1, -1 );
			}
		}
	}

	const { defaultView } = element.ownerDocument;

	defaultView.addEventListener( 'paste', _onPaste );
	return () => {
		defaultView.removeEventListener( 'paste', _onPaste );
	};
};
