import { pasteHandler } from '@wordpress/blocks';
import {
	isEmpty,
	insert,
	create,
	getActiveFormats,
	privateApis as richTextPrivateApis,
} from '@wordpress/rich-text';
import { isURL } from '@wordpress/url';
import { privateApis as composePrivateApis } from '@wordpress/compose';
import { store as blockEditorStore } from '../../../store';
import { addActiveFormats } from '../utils';
import { getPasteEventData } from '../../../utils/pasting';
import { unlock } from '../../../lock-unlock';
import type { RichTextEventListener } from '../types';

const { subscribeDelegatedListener } = unlock( composePrivateApis );
const { ownsSelection } = unlock( richTextPrivateApis );

const pasteHandlerListener: RichTextEventListener =
	( props ) => ( element ) => {
		function _onPaste( event: ClipboardEvent ) {
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
				registry,
			} = props.current;

			// The event listener is attached to the window, so we need to check if
			// the target is the element or inside the element. When the editable
			// wrapper holds focus (the selected block supports `editableRoot`),
			// the event targets the wrapper instead; the element then owns the
			// paste when it contains the selection.
			if (
				! element.contains( event.target as Node | null ) &&
				! ownsSelection( element )
			) {
				return;
			}

			if ( event.defaultPrevented ) {
				return;
			}

			// Missing clipboard data throws inside, which returns undefined.
			const pasteData = getPasteEventData(
				event as ClipboardEvent & { clipboardData: DataTransfer }
			);

			// Some browsers don't support `clipboardData` and paste plain text on
			// their own, so the event has to be left alone for them.
			if ( ! pasteData ) {
				return;
			}

			event.preventDefault();

			// The text is only missing with files, which return below.
			const { plainText, html, files } = pasteData as {
				plainText: string;
				html: string;
				files: File[];
			};

			// Rich text can only paste text; files are placed by the writing flow.
			if ( files.length ) {
				return;
			}

			// Allows us to ask for this information when we get a report.
			// `pasteHandler` also logs this, but we're not using `pasteHandler` in
			// every case.
			window.console.log( 'Received HTML (RichText):\n\n', html );
			window.console.log(
				'Received plain text (RichText):\n\n',
				plainText
			);

			if ( disableFormats ) {
				onChange( insert( value, plainText ) );
				return;
			}

			// Pasting without clipboard data returned above.
			const isInternal =
				event.clipboardData!.getData( 'rich-text' ) === 'true';

			function pasteInline( content: string ) {
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
					addActiveFormats(
						valueToInsert,
						getActiveFormats( value )
					);
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
				const valueToInsert = create( { text: plainText } );
				addActiveFormats( valueToInsert, getActiveFormats( value ) );
				onChange( insert( value, valueToInsert ) );
				return;
			}

			let mode: 'INLINE' | 'BLOCKS' = 'INLINE';

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
				// Fields render HTML tags.
				tagName: tagName as string,
				// @ts-expect-error The paste handler ignores `preserveWhiteSpace`.
				preserveWhiteSpace,
			} );

			if ( typeof content === 'string' ) {
				pasteInline( content );
				return;
			}

			if ( ! content.length || ! onReplace || ! isEmpty( value ) ) {
				return;
			}

			// Record an intermediate paragraph-with-URL state so a single undo
			// after the URL → block transformation restores the pasted link.
			if ( mode === 'BLOCKS' ) {
				pasteInline( html );
				registry
					.dispatch( blockEditorStore )
					.__unstableMarkLastChangeAsPersistent();
			}

			onReplace( content, content.length - 1, -1 );
		}

		const { defaultView } = element.ownerDocument;

		// Attach the listener to the window so parent elements have the chance to
		// prevent the default behavior.
		return subscribeDelegatedListener( defaultView, 'paste', _onPaste );
	};

export default pasteHandlerListener;
