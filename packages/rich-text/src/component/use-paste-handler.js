/**
 * WordPress dependencies
 */
import { useRef } from '@wordpress/element';
import { useRefEffect } from '@wordpress/compose';
import { getFilesFromDataTransfer } from '@wordpress/dom';

/**
 * Internal dependencies
 */
import { insert } from '../insert';

export function usePasteHandler( props ) {
	const propsRef = useRef( props );
	propsRef.current = props;
	return useRefEffect( ( element ) => {
		function _onPaste( event ) {
			const {
				isSelected,
				disableFormats,
				handleChange,
				record,
				formatTypes,
				onPaste,
				removeEditorOnlyFormats,
				activeFormats,
			} = propsRef.current;

			if ( ! isSelected ) {
				event.preventDefault();
				return;
			}

			const { clipboardData } = event;

			let plainText = '';
			let html = '';

			// IE11 only supports `Text` as an argument for `getData` and will
			// otherwise throw an invalid argument error, so we try the standard
			// arguments first, then fallback to `Text` if they fail.
			try {
				plainText = clipboardData.getData( 'text/plain' );
				html = clipboardData.getData( 'text/html' );
			} catch ( error1 ) {
				try {
					html = clipboardData.getData( 'Text' );
				} catch ( error2 ) {
					// Some browsers like UC Browser paste plain text by default and
					// don't support clipboardData at all, so allow default
					// behaviour.
					return;
				}
			}

			event.preventDefault();

			// Allows us to ask for this information when we get a report.
			window.console.log( 'Received HTML:\n\n', html );
			window.console.log( 'Received plain text:\n\n', plainText );

			if ( disableFormats ) {
				handleChange( insert( record.current, plainText ) );
				return;
			}

			const transformed = formatTypes.reduce(
				( accumlator, { __unstablePasteRule } ) => {
					// Only allow one transform.
					if (
						__unstablePasteRule &&
						accumlator === record.current
					) {
						accumlator = __unstablePasteRule( record.current, {
							html,
							plainText,
						} );
					}

					return accumlator;
				},
				record.current
			);

			if ( transformed !== record.current ) {
				handleChange( transformed );
				return;
			}

			if ( onPaste ) {
				const files = getFilesFromDataTransfer( clipboardData );
				const isInternal =
					clipboardData.getData( 'rich-text' ) === 'true';

				onPaste( {
					value: removeEditorOnlyFormats( record.current ),
					onChange: handleChange,
					html,
					plainText,
					isInternal,
					files: [ ...files ],
					activeFormats,
				} );
			}
		}

		element.addEventListener( 'paste', _onPaste );
		return () => {
			element.removeEventListener( 'paste', _onPaste );
		};
	}, [] );
}
