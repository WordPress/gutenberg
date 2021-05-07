/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useEffect, useRef, useState } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
import { useSelect, useDispatch } from '@wordpress/data';
import { pasteHandler } from '@wordpress/blocks';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { __experimentalRichText as RichText } from '@wordpress/rich-text';

/**
 * Internal dependencies
 */
import PostTypeSupportCheck from '../post-type-support-check';

/**
 * Constants
 */
const REGEXP_NEWLINES = /[\r\n]+/g;

export default function PostTitle() {
	const ref = useRef();
	const [ isSelected, setIsSelected ] = useState( false );
	const { editPost } = useDispatch( 'core/editor' );
	const {
		insertDefaultBlock,
		clearSelectedBlock,
		insertBlocks,
	} = useDispatch( blockEditorStore );
	const {
		isCleanNewPost,
		title,
		placeholder,
		isFocusMode,
		hasFixedToolbar,
	} = useSelect( ( select ) => {
		const {
			getEditedPostAttribute,
			isCleanNewPost: _isCleanNewPost,
		} = select( 'core/editor' );
		const { getSettings } = select( blockEditorStore );
		const {
			titlePlaceholder,
			focusMode,
			hasFixedToolbar: _hasFixedToolbar,
		} = getSettings();

		return {
			isCleanNewPost: _isCleanNewPost(),
			title: getEditedPostAttribute( 'title' ),
			placeholder: titlePlaceholder,
			isFocusMode: focusMode,
			hasFixedToolbar: _hasFixedToolbar,
		};
	} );

	useEffect( () => {
		if ( ! ref.current ) {
			return;
		}

		const { ownerDocument } = ref.current;
		const { activeElement, body } = ownerDocument;

		// Only autofocus the title when the post is entirely empty. This should
		// only happen for a new post, which means we focus the title on new
		// post so the author can start typing right away, without needing to
		// click anything.
		if ( isCleanNewPost && ( ! activeElement || body === activeElement ) ) {
			ref.current.focus();
		}
	}, [ isCleanNewPost ] );

	function onEnterPress() {
		insertDefaultBlock( undefined, undefined, 0 );
	}

	function onInsertBlockAfter( blocks ) {
		insertBlocks( blocks, 0 );
	}

	function onUpdate( newTitle ) {
		editPost( { title: newTitle } );
	}

	function onSelect() {
		setIsSelected( true );
		clearSelectedBlock();
	}

	function onUnselect() {
		setIsSelected( false );
	}

	function onChange( value ) {
		onUpdate( value.replace( REGEXP_NEWLINES, ' ' ) );
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

		if ( typeof content !== 'string' && content.length ) {
			event.preventDefault();

			const [ firstBlock ] = content;

			if (
				! title &&
				( firstBlock.name === 'core/heading' ||
					firstBlock.name === 'core/paragraph' )
			) {
				onUpdate( firstBlock.attributes.content );
				onInsertBlockAfter( content.slice( 1 ) );
			} else {
				onInsertBlockAfter( content );
			}
		}
	}

	// The wp-block className is important for editor styles.
	// This same block is used in both the visual and the code editor.
	const className = classnames(
		'wp-block editor-post-title editor-post-title__block',
		{
			'is-selected': isSelected,
			'is-focus-mode': isFocusMode,
			'has-fixed-toolbar': hasFixedToolbar,
		}
	);
	const decodedPlaceholder = decodeEntities( placeholder );

	const [ selection, setSelection ] = useState( {} );

	return (
		<PostTypeSupportCheck supportKeys="title">
			<div className={ className }>
				<RichText
					ref={ ref }
					tagName="h1"
					__unstableDisableFormats
					preserveWhiteSpace
					className="editor-post-title__input"
					value={ title }
					onChange={ onChange }
					selectionStart={ selection.start }
					selectionEnd={ selection.end }
					onSelectionChange={ ( newStart, newEnd ) => {
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
					} }
					placeholder={ decodedPlaceholder || __( 'Add title' ) }
					onFocus={ onSelect }
					onBlur={ onUnselect }
					onEnter={ onEnterPress }
					onKeyPress={ onUnselect }
					onPaste={ onPaste }
				/>
			</div>
		</PostTypeSupportCheck>
	);
}
