/**
 * WordPress dependencies
 */
import { forwardRef, useState } from '@wordpress/element';
import { ENTER } from '@wordpress/keycodes';
import { useDispatch } from '@wordpress/data';
import { pasteHandler } from '@wordpress/blocks';
import { store as blockEditorStore } from '@wordpress/block-editor';
import {
	__unstableUseRichText as useRichText,
	create,
	toHTMLString,
	insert,
} from '@wordpress/rich-text';
import { useMergeRefs } from '@wordpress/compose';
import { __unstableStripHTML as stripHTML } from '@wordpress/dom';

/**
 * Internal dependencies
 */
import PostTypeSupportCheck from '../post-type-support-check';

const PostTitleRich = forwardRef(
	(
		{ title, placeholder, onChange, onUpdate, className, setIsSelected },
		ref
	) => {
		const [ selection, setSelection ] = useState( {} );

		const { clearSelectedBlock, insertBlocks, insertDefaultBlock } =
			useDispatch( blockEditorStore );

		function onInsertBlockAfter( blocks ) {
			insertBlocks( blocks, 0 );
		}

		function onSelect() {
			setIsSelected( true );
			clearSelectedBlock();
		}

		function onUnselect() {
			setIsSelected( false );
			setSelection( {} );
		}

		function onEnterPress() {
			insertDefaultBlock( undefined, undefined, 0 );
		}

		function onKeyDown( event ) {
			if ( event.keyCode === ENTER ) {
				event.preventDefault();
				onEnterPress();
			}
		}

		function onPaste( event ) {
			const clipboardData = event.clipboardData;

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

			// Allows us to ask for this information when we get a report.
			window.console.log( 'Received HTML:\n\n', html );
			window.console.log( 'Received plain text:\n\n', plainText );

			const content = pasteHandler( {
				HTML: html,
				plainText,
			} );

			event.preventDefault();

			if ( ! content.length ) {
				return;
			}

			if ( typeof content !== 'string' ) {
				const [ firstBlock ] = content;

				if (
					! title &&
					( firstBlock.name === 'core/heading' ||
						firstBlock.name === 'core/paragraph' )
				) {
					onUpdate( stripHTML( firstBlock.attributes.content ) );
					onInsertBlockAfter( content.slice( 1 ) );
				} else {
					onInsertBlockAfter( content );
				}
			} else {
				const value = {
					...create( { html: title } ),
					...selection,
				};
				const newValue = insert(
					value,
					create( { html: stripHTML( content ) } )
				);
				onUpdate( toHTMLString( { value: newValue } ) );
				setSelection( {
					start: newValue.start,
					end: newValue.end,
				} );
			}
		}

		const { ref: richTextRef } = useRichText( {
			value: title,
			onChange,
			placeholder,
			selectionStart: selection.start,
			selectionEnd: selection.end,
			onSelectionChange( newStart, newEnd ) {
				setSelection( ( sel ) => {
					const { start, end } = sel;
					if ( start === newStart && end === newEnd ) {
						return sel;
					}
					return {
						start: newStart,
						end: newEnd,
					};
				} );
			},
			__unstableDisableFormats: false,
			preserveWhiteSpace: true,
		} );

		return (
			/* eslint-disable jsx-a11y/heading-has-content, jsx-a11y/no-noninteractive-element-to-interactive-role */
			<PostTypeSupportCheck supportKeys="title">
				<h1
					ref={ useMergeRefs( [ richTextRef, ref ] ) }
					contentEditable
					className={ className }
					aria-label={ placeholder }
					role="textbox"
					aria-multiline="true"
					onFocus={ onSelect }
					onBlur={ onUnselect }
					onKeyDown={ onKeyDown }
					onKeyPress={ onUnselect }
					onPaste={ onPaste }
				/>
			</PostTypeSupportCheck>
			/* eslint-enable jsx-a11y/heading-has-content, jsx-a11y/no-noninteractive-element-to-interactive-role */
		);
	}
);

export default PostTitleRich;
