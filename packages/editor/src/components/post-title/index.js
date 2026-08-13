import clsx from 'clsx';
import { __ } from '@wordpress/i18n';
import { forwardRef, useState } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
import { useSelect, useDispatch, useRegistry } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { ENTER, DELETE } from '@wordpress/keycodes';
import {
	pasteHandler,
	isUnmodifiedDefaultBlock,
	getDefaultBlockName,
	switchToBlockType,
} from '@wordpress/blocks';
import {
	privateApis as richTextPrivateApis,
	create,
	insert,
} from '@wordpress/rich-text';
import { useMergeRefs } from '@wordpress/compose';
import { __unstableStripHTML as stripHTML } from '@wordpress/dom';
import { DEFAULT_CLASSNAMES, REGEXP_NEWLINES } from './constants';
import usePostTitleFocus from './use-post-title-focus';
import usePostTitle from './use-post-title';
import PostTypeSupportCheck from '../post-type-support-check';
import { unlock } from '../../lock-unlock';

const { useRichText } = unlock( richTextPrivateApis );

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

	const registry = useRegistry();
	const { getBlockOrder, getBlock, canRemoveBlock } =
		useSelect( blockEditorStore );

	const [ isSelected, setIsSelected ] = useState( false );

	const { ref: focusRef } = usePostTitleFocus( forwardedRef );

	const { title, setTitle: onUpdate } = usePostTitle();

	const [ selection, setSelection ] = useState( {} );

	const {
		clearSelectedBlock,
		insertBlocks,
		insertDefaultBlock,
		removeBlock,
		replaceBlocks,
	} = useDispatch( blockEditorStore );

	const decodedPlaceholder =
		decodeEntities( placeholder ) || __( 'Add title' );

	const {
		value,
		getValue,
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

	function onForwardDeletePress( event ) {
		const { start, end, text } = getValue();

		// The browser handles deletion within the title itself.
		if ( start !== text.length || end !== text.length ) {
			return;
		}

		const clientId = getBlockOrder()[ 0 ];

		if ( ! clientId || ! canRemoveBlock( clientId ) ) {
			return;
		}

		const block = getBlock( clientId );

		if ( isUnmodifiedDefaultBlock( block ) ) {
			event.preventDefault();
			// Batch so that when removing the last block reinserts a
			// selected default block (see ensureDefaultBlock), the
			// selection never reaches subscribers and focus stays in the
			// title.
			registry.batch( () => {
				removeBlock( clientId, false );
				clearSelectedBlock();
			} );
			return;
		}

		// Blocks with inner blocks are left alone for now. Between blocks,
		// forward delete moves the first inner block out of the container
		// rather than merging text (see onMerge in block.js).
		if ( getBlockOrder( clientId ).length ) {
			return;
		}

		// As between blocks, transform the block to the default type
		// before merging, so any block with such a transform can merge
		// into the title. Without a transform, do nothing.
		const [ blockOfDefaultType, ...remainingBlocks ] =
			( block.name === getDefaultBlockName()
				? [ block ]
				: switchToBlockType( block, getDefaultBlockName() ) ) ?? [];

		if ( ! blockOfDefaultType ) {
			return;
		}

		event.preventDefault();
		registry.batch( () => {
			// Strip HTML as when pasting: it is assumed that HTML in the
			// title is undesirable.
			const contentNoHTML = stripHTML(
				blockOfDefaultType.attributes.content?.toString() ?? ''
			);
			const newValue = insert(
				getValue(),
				create( { html: contentNoHTML } ),
				text.length,
				text.length
			);
			// As with merging blocks, keep the caret at the merge point.
			onChange( {
				...newValue,
				start: text.length,
				end: text.length,
			} );

			if ( remainingBlocks.length ) {
				replaceBlocks( clientId, remainingBlocks );
			} else {
				removeBlock( clientId, false );
			}
			clearSelectedBlock();
		} );
	}

	function onKeyDown( event ) {
		if ( event.keyCode === ENTER ) {
			event.preventDefault();
			onEnterPress();
		} else if ( event.keyCode === DELETE ) {
			onForwardDeletePress( event );
		}
	}

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

	// Because the title is within the editor iframe, we can't use scss styles.
	// Instead use an inline style to dim the block when it's disabled.
	const style = isEditingContentOnlySection ? { opacity: 0.2 } : undefined;

	return (
		/* eslint-disable jsx-a11y/no-noninteractive-element-to-interactive-role */
		<h1
			ref={ useMergeRefs( [ richTextRef, focusRef ] ) }
			contentEditable={ ! isEditingContentOnlySection && ! isPreview }
			className={ className }
			aria-label={ decodedPlaceholder }
			role="textbox"
			aria-multiline="true"
			onFocus={ onSelect }
			onBlur={ onUnselect }
			onKeyDown={ onKeyDown }
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
