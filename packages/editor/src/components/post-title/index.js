/**
 * External dependencies
 */
import clsx from 'clsx';
/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { forwardRef, useState } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { ENTER } from '@wordpress/keycodes';
import { pasteHandler } from '@wordpress/blocks';
import {
	__unstableUseRichText as useRichText,
	create,
	insert,
} from '@wordpress/rich-text';
import { useMergeRefs } from '@wordpress/compose';
import { __unstableStripHTML as stripHTML } from '@wordpress/dom';

/**
 * Internal dependencies
 */
import { DEFAULT_CLASSNAMES, REGEXP_NEWLINES } from './constants';
import usePostTitleFocus from './use-post-title-focus';
import usePostTitle from './use-post-title';
import PostTypeSupportCheck from '../post-type-support-check';

const PostTitle = forwardRef( ( _, forwardedRef ) => {
	const { placeholder } = useSelect( ( select ) => {
		const { getSettings } = select( blockEditorStore );
		const { titlePlaceholder } = getSettings();

		return {
			placeholder: titlePlaceholder,
		};
	}, [] );

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

		try {
			plainText = clipboardData.getData( 'text/plain' );
			html = clipboardData.getData( 'text/html' );
		} catch ( error ) {
			// Some browsers like UC Browser paste plain text by default and
			// don't support clipboardData at all, so allow default
			// behaviour.
			return;
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

	return (
		/* eslint-disable jsx-a11y/heading-has-content, jsx-a11y/no-noninteractive-element-to-interactive-role */
		<h1
			ref={ useMergeRefs( [ richTextRef, focusRef ] ) }
			contentEditable
			className={ className }
			aria-label={ decodedPlaceholder }
			role="textbox"
			aria-multiline="true"
			onFocus={ onSelect }
			onBlur={ onUnselect }
			onKeyDown={ onKeyDown }
			onPaste={ onPaste }
		/>
		/* eslint-enable jsx-a11y/heading-has-content, jsx-a11y/no-noninteractive-element-to-interactive-role */
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
