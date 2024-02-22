/**
 * WordPress dependencies
 */
import { useRef } from '@wordpress/element';
import { useRefEffect } from '@wordpress/compose';
import {
	pasteHandler,
	findTransform,
	getBlockTransforms,
} from '@wordpress/blocks';
import { isEmpty, insert, create } from '@wordpress/rich-text';
import { isURL } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { addActiveFormats } from './utils';
import { splitValue } from './split-value';
import { getPasteEventData } from '../../utils/pasting';

/** @typedef {import('@wordpress/rich-text').RichTextValue} RichTextValue */

export function usePasteHandler( props ) {
	const propsRef = useRef( props );
	propsRef.current = props;
	return useRefEffect( ( element ) => {
		function _onPaste( event ) {
			const {
				isSelected,
				disableFormats,
				onChange,
				value,
				formatTypes,
				tagName,
				onReplace,
				onSplit,
				__unstableEmbedURLOnPaste,
				pastePlainText,
			} = propsRef.current;

			if ( ! isSelected ) {
				return;
			}

			const { plainText, html, files } = getPasteEventData( event );

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

			if ( files?.length ) {
				// Allows us to ask for this information when we get a report.
				// eslint-disable-next-line no-console
				window.console.log( 'Received items:\n\n', files );

				const fromTransforms = getBlockTransforms( 'from' );
				const blocks = files
					.reduce( ( accumulator, file ) => {
						const transformation = findTransform(
							fromTransforms,
							( transform ) =>
								transform.type === 'files' &&
								transform.isMatch( [ file ] )
						);
						if ( transformation ) {
							accumulator.push(
								transformation.transform( [ file ] )
							);
						}
						return accumulator;
					}, [] )
					.flat();
				if ( ! blocks.length ) {
					return;
				}

				if ( onReplace && isEmpty( value ) ) {
					onReplace( blocks );
				} else {
					splitValue( {
						value,
						pastedBlocks: blocks,
						onReplace,
						onSplit,
					} );
				}

				return;
			}

			let mode = onReplace && onSplit ? 'AUTO' : 'INLINE';

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
			} );

			if ( typeof content === 'string' ) {
				pasteInline( content );
			} else if ( content.length > 0 ) {
				if ( onReplace && isEmpty( value ) ) {
					onReplace( content, content.length - 1, -1 );
				} else {
					splitValue( {
						value,
						pastedBlocks: content,
						onReplace,
						onSplit,
					} );
				}
			}
		}

		element.addEventListener( 'paste', _onPaste );
		return () => {
			element.removeEventListener( 'paste', _onPaste );
		};
	}, [] );
}
