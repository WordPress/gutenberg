import clsx from 'clsx';
import { __ } from '@wordpress/i18n';
import { forwardRef, useState } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import {
	pasteHandler,
	privateApis as blocksPrivateApis,
} from '@wordpress/blocks';
import {
	privateApis as richTextPrivateApis,
	create,
	insert,
} from '@wordpress/rich-text';
import { useMergeRefs, useRefEffect } from '@wordpress/compose';
import { __unstableStripHTML as stripHTML } from '@wordpress/dom';
import { DEFAULT_CLASSNAMES, REGEXP_NEWLINES } from './constants';
import usePostTitleFocus from './use-post-title-focus';
import usePostTitle from './use-post-title';
import splitFirstLine from './split-first-line';
import PostTypeSupportCheck from '../post-type-support-check';
import { unlock } from '../../lock-unlock';

const { useRichText } = unlock( richTextPrivateApis );
const { isPlainTextPaste } = unlock( blocksPrivateApis );

/**
 * Whether a pasted block holds text that can be the title.
 *
 * @param {Object} block The block.
 *
 * @return {boolean} Whether its content can be the title.
 */
function isTextBlock( block ) {
	return block?.name === 'core/heading' || block?.name === 'core/paragraph';
}

const PostTitle = forwardRef( ( _, forwardedRef ) => {
	const { placeholder, isEditingContentOnlySection, isPreview } = useSelect(
		( select ) => {
			const { getSettings, getEditedContentOnlySection } = unlock(
				select( blockEditorStore )
			);
			const { titlePlaceholder, isPreviewMode } = getSettings();

			return {
				placeholder: titlePlaceholder,
				isEditingContentOnlySection: !! getEditedContentOnlySection(),
				isPreview: isPreviewMode,
			};
		},
		[]
	);

	const [ isSelected, setIsSelected ] = useState( false );

	const { ref: focusRef } = usePostTitleFocus( forwardedRef );

	const { title, setTitle: onUpdate } = usePostTitle();

	const [ selection, setSelection ] = useState( {} );

	const { clearSelectedBlock, insertBlocks, insertDefaultBlock } =
		useDispatch( blockEditorStore );

	const decodedPlaceholder =
		decodeEntities( placeholder ) || __( 'Add title' );

	const {
		value,
		onChange,
		ref: richTextRef,
	} = useRichText( {
		value: title,
		onChange( newValue ) {
			onUpdate( newValue.replace( REGEXP_NEWLINES, ' ' ) );
		},
		placeholder: decodedPlaceholder,
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
	} );

	function onInsertBlockAfter( blocks ) {
		insertBlocks( blocks, 0 );
	}

	// Inserts text at the caret, which stays after it. The text is escaped on
	// the way into the title, so it is never rendered as HTML.
	function insertText( text ) {
		onChange( insert( value, create( { text } ) ) );
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

	// A native listener: React's onBeforeInput is synthesized from other
	// events and does not carry the input type. Handled on beforeinput rather
	// than keydown: moving focus to the new block while the keydown is still
	// being handled leaves the iOS keyboard's auto-capitalization stale.
	const enterRef = useRefEffect( ( element ) => {
		function onBeforeInput( event ) {
			if (
				event.inputType === 'insertParagraph' ||
				event.inputType === 'insertLineBreak'
			) {
				event.preventDefault();
				onEnterPress();
			}
		}
		element.addEventListener( 'beforeinput', onBeforeInput );
		return () => {
			element.removeEventListener( 'beforeinput', onBeforeInput );
		};
	}, [] );

	function onPaste( event ) {
		const clipboardData = event.clipboardData;

		let plainText = '';
		let html = '';

		try {
			plainText = clipboardData.getData( 'text/plain' );
			html = clipboardData.getData( 'text/html' );
		} catch {
			// Some browsers like UC Browser paste plain text by default and
			// don't support clipboardData at all, so allow default
			// behaviour.
			return;
		}

		event.preventDefault();

		// The title is plain text, so plain text is pasted verbatim: the paste
		// handler would parse it as Markdown and consume characters like `#`
		// or `**` that the title has no formatting to carry. Only the lines
		// that do not fit in the title go through the handler, as blocks.
		if ( isPlainTextPaste( { HTML: html, plainText } ) ) {
			const [ firstLine, remainder ] = splitFirstLine( plainText );

			if ( ! remainder ) {
				insertText( firstLine );
				return;
			}

			const blocks = pasteHandler( { plainText, mode: 'BLOCKS' } );

			// As with HTML, the first line is only the title when it is text;
			// a list or a code block pasted into an empty title stays whole.
			if ( ! title && isTextBlock( blocks[ 0 ] ) ) {
				insertText( firstLine );
				onInsertBlockAfter(
					pasteHandler( { plainText: remainder, mode: 'BLOCKS' } )
				);
			} else {
				onInsertBlockAfter( blocks );
			}
			return;
		}

		const content = pasteHandler( {
			HTML: html,
			plainText,
		} );

		if ( ! content.length ) {
			return;
		}

		if ( typeof content !== 'string' ) {
			const [ firstBlock ] = content;

			if ( ! title && isTextBlock( firstBlock ) ) {
				// Strip HTML to avoid unwanted HTML being added to the title.
				// In the majority of cases it is assumed that HTML in the title
				// is undesirable.
				const contentNoHTML = stripHTML(
					firstBlock.attributes.content
				);
				onUpdate( contentNoHTML );
				onInsertBlockAfter( content.slice( 1 ) );
			} else {
				onInsertBlockAfter( content );
			}
		} else {
			// Strip HTML to avoid unwanted HTML being added to the title.
			// In the majority of cases it is assumed that HTML in the title
			// is undesirable.
			const contentNoHTML = stripHTML( content );
			onChange( insert( value, create( { html: contentNoHTML } ) ) );
		}
	}

	// The wp-block className is important for editor styles.
	// This same block is used in both the visual and the code editor.
	const className = clsx( DEFAULT_CLASSNAMES, {
		'is-selected': isSelected,
	} );

	// Because the title is within the editor iframe, we can't use scss styles.
	// Instead use an inline style to dim the block when it's disabled.
	const style = isEditingContentOnlySection ? { opacity: 0.2 } : undefined;

	return (
		/* eslint-disable jsx-a11y/no-noninteractive-element-to-interactive-role */
		<h1
			ref={ useMergeRefs( [ richTextRef, focusRef, enterRef ] ) }
			contentEditable={ ! isEditingContentOnlySection && ! isPreview }
			className={ className }
			aria-label={ decodedPlaceholder }
			role="textbox"
			aria-multiline="true"
			onFocus={ onSelect }
			onBlur={ onUnselect }
			onPaste={ onPaste }
			style={ style }
		/>
		/* eslint-enable jsx-a11y/no-noninteractive-element-to-interactive-role */
	);
} );

/**
 * Renders the `PostTitle` component.
 *
 * @param {Object}  _            Unused parameter.
 * @param {Element} forwardedRef Forwarded ref for the component.
 *
 * @return {React.ReactNode} The rendered PostTitle component.
 */
export default forwardRef( ( _, forwardedRef ) => (
	<PostTypeSupportCheck supportKeys="title">
		<PostTitle ref={ forwardedRef } />
	</PostTypeSupportCheck>
) );
