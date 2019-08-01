/**
 * External dependencies
 */
import classnames from 'classnames';
import { omit } from 'lodash';

/**
 * WordPress dependencies
 */
import { RawHTML } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import { pasteHandler, children as childrenSource, getBlockTransforms, findTransform } from '@wordpress/blocks';
import { withInstanceId, compose } from '@wordpress/compose';
import {
	RichText,
	__unstableCreateElement,
	isEmpty,
	__unstableIsEmptyLine as isEmptyLine,
	insert,
	__unstableInsertLineSeparator as insertLineSeparator,
	create,
	replace,
	split,
	LINE_SEPARATOR,
	toHTMLString,
	slice,
} from '@wordpress/rich-text';
import { withFilters, IsolatedEventContainer } from '@wordpress/components';
import { createBlobURL } from '@wordpress/blob';
import deprecated from '@wordpress/deprecated';

/**
 * Internal dependencies
 */
import Autocomplete from '../autocomplete';
import BlockFormatControls from '../block-format-controls';
import FormatToolbar from './format-toolbar';
import { withBlockEditContext } from '../block-edit/context';
import { RemoveBrowserShortcuts } from './remove-browser-shortcuts';

const wrapperClasses = 'editor-rich-text block-editor-rich-text';
const classes = 'editor-rich-text__editable block-editor-rich-text__editable';

/**
 * Get the multiline tag based on the multiline prop.
 *
 * @param {?(string|boolean)} multiline The multiline prop.
 *
 * @return {?string} The multiline tag.
 */
function getMultilineTag( multiline ) {
	if ( multiline !== true && multiline !== 'p' && multiline !== 'li' ) {
		return;
	}

	return multiline === true ? 'p' : multiline;
}

function RichTextWrapper( {
	children,
	tagName,
	value: originalValue,
	onChange: originalOnChange,
	multiline,
	inlineToolbar,
	wrapperClassName,
	className,
	autocompleters,
	onReplace,
	isSelected: originalIsSelected,
	placeholder,
	formattingControls,
	allowedFormats,
	withoutInteractiveFormatting,
	onRemove,
	onMerge,
	onSplit,
	__unstableOnSplitMiddle: onSplitMiddle,
	clientId,
	instanceId,
	identifier = instanceId,
	// From experimental filter. To do: pick props instead.
	...experimentalProps
} ) {
	const selector = ( select ) => {
		const {
			isCaretWithinFormattedText,
			getSelectionStart,
			getSelectionEnd,
			getSettings,
		} = select( 'core/block-editor' );
		const { __experimentalCanUserUseUnfilteredHTML } = getSettings();
		return {
			canUserUseUnfilteredHTML: __experimentalCanUserUseUnfilteredHTML,
			isCaretWithinFormattedText: isCaretWithinFormattedText(),
			selectionStartObject: getSelectionStart(),
			selectionEndObject: getSelectionEnd(),
		};
	};

	const {
		canUserUseUnfilteredHTML,
		isCaretWithinFormattedText,
		selectionStartObject,
		selectionEndObject,
	} = useSelect( selector );

	const {
		__unstableMarkLastChangeAsPersistent: onCreateUndoLevel,
		enterFormattedText: onEnterFormattedText,
		exitFormattedText: onExitFormattedText,
		selectionChange,
	} = useDispatch( 'core/block-editor' );

	if ( originalIsSelected === undefined ) {
		originalIsSelected = (
			selectionStartObject.clientId === clientId &&
			selectionStartObject.attributeKey === identifier
		);
	}

	let selectionStart;
	let selectionEnd;

	if ( originalIsSelected ) {
		selectionStart = selectionStartObject.offset;
		selectionEnd = selectionEndObject.offset;
	}

	const onSelectionChange = ( start, end ) => {
		selectionChange( clientId, identifier, start, end );
	};

	/**
	 * Signals to the RichText owner that the block can be replaced with two
	 * blocks as a result of splitting the block by pressing enter, or with
	 * blocks as a result of splitting the block by pasting block content in the
	 * instance.
	 *
	 * @param  {Object} record       The rich text value to split.
	 * @param  {Array}  pastedBlocks The pasted blocks to insert, if any.
	 */
	const _onSplit = ( record, pastedBlocks = [] ) => {
		if ( ! onReplace || ! onSplit ) {
			return;
		}

		const blocks = [];
		const [ before, after ] = split( record );
		const hasPastedBlocks = pastedBlocks.length > 0;
		const multilineTag = getMultilineTag( multiline );

		// Create a block with the content before the caret if there's no pasted
		// blocks, or if there are pasted blocks and the value is not empty.
		// We do not want a leading empty block on paste, but we do if split
		// with e.g. the enter key.
		if ( ! hasPastedBlocks || ! isEmpty( before ) ) {
			blocks.push( onSplit( toHTMLString( {
				value: before,
				multilineTag,
			} ) ) );
		}

		if ( hasPastedBlocks ) {
			blocks.push( ...pastedBlocks );
		} else if ( onSplitMiddle ) {
			blocks.push( onSplitMiddle() );
		}

		// If there's pasted blocks, append a block with the content after the
		// caret. Otherwise, do append and empty block if there is no
		// `onSplitMiddle` prop, but if there is and the content is empty, the
		// middle block is enough to set focus in.
		if ( hasPastedBlocks || ! onSplitMiddle || ! isEmpty( after ) ) {
			blocks.push( onSplit( toHTMLString( {
				value: after,
				multilineTag,
			} ) ) );
		}

		// If there are pasted blocks, set the selection to the last one.
		// Otherwise, set the selection to the second block.
		const indexToSelect = hasPastedBlocks ? blocks.length - 1 : 1;

		onReplace( blocks, indexToSelect );
	};

	const onEnter = ( { value, onChange, shiftKey } ) => {
		const canSplit = onReplace && onSplit;

		if ( onReplace ) {
			const transforms = getBlockTransforms( 'from' )
				.filter( ( { type } ) => type === 'enter' );
			const transformation = findTransform( transforms, ( item ) => {
				return item.regExp.test( value.text );
			} );

			if ( transformation ) {
				onReplace( [
					transformation.transform( { content: value.text } ),
				] );
			}
		}

		if ( multiline ) {
			if ( shiftKey ) {
				onChange( insert( value, '\n' ) );
			} else if ( canSplit && isEmptyLine( value ) ) {
				_onSplit( value );
			} else {
				onChange( insertLineSeparator( value ) );
			}
		} else if ( shiftKey || ! canSplit ) {
			onChange( insert( value, '\n' ) );
		} else {
			_onSplit( value );
		}
	};

	const onDelete = ( { isReverse, value } ) => {
		if ( onMerge ) {
			onMerge( ! isReverse );
		}

		// Only handle remove on Backspace. This serves dual-purpose of being
		// an intentional user interaction distinguishing between Backspace and
		// Delete to remove the empty field, but also to avoid merge & remove
		// causing destruction of two fields (merge, then removed merged).
		if ( onRemove && isEmpty( value ) && isReverse ) {
			onRemove( ! isReverse );
		}
	};

	const onPaste = ( { value, onChange, html, plainText, image } ) => {
		if ( image && ! html ) {
			const file = image.getAsFile ? image.getAsFile() : image;
			const content = pasteHandler( {
				HTML: `<img src="${ createBlobURL( file ) }">`,
				mode: 'BLOCKS',
				tagName,
			} );
			const shouldReplace = onReplace && isEmpty( value );

			// Allows us to ask for this information when we get a report.
			window.console.log( 'Received item:\n\n', file );

			if ( shouldReplace ) {
				onReplace( content );
			} else {
				_onSplit( value, content );
			}

			return;
		}

		const canReplace = onReplace && isEmpty( value );
		const canSplit = onReplace && onSplit;

		let mode = 'INLINE';

		if ( canReplace ) {
			mode = 'BLOCKS';
		} else if ( canSplit ) {
			mode = 'AUTO';
		}

		const content = pasteHandler( {
			HTML: html,
			plainText,
			mode,
			tagName,
			canUserUseUnfilteredHTML,
		} );

		if ( typeof content === 'string' ) {
			let valueToInsert = create( { html: content } );

			// If the content should be multiline, we should process text
			// separated by a line break as separate lines.
			if ( multiline ) {
				valueToInsert = replace( valueToInsert, /\n+/g, LINE_SEPARATOR );
			}

			onChange( insert( value, valueToInsert ) );
		} else if ( content.length > 0 ) {
			if ( canReplace ) {
				onReplace( content );
			} else {
				_onSplit( value, content );
			}
		}
	};

	const inputRule = ( value, valueToFormat ) => {
		if ( ! onReplace ) {
			return;
		}

		const { start, text } = value;
		const characterBefore = text.slice( start - 1, start );

		if ( ! /\s/.test( characterBefore ) ) {
			return;
		}

		const trimmedTextBefore = text.slice( 0, start ).trim();
		const prefixTransforms = getBlockTransforms( 'from' )
			.filter( ( { type } ) => type === 'prefix' );
		const transformation = findTransform( prefixTransforms, ( { prefix } ) => {
			return trimmedTextBefore === prefix;
		} );

		if ( ! transformation ) {
			return;
		}

		const content = valueToFormat( slice( value, start, text.length ) );
		const block = transformation.transform( content );

		onReplace( [ block ] );
	};

	const getAllowedFormats = () => {
		if ( ! allowedFormats && ! formattingControls ) {
			return;
		}

		if ( allowedFormats ) {
			return allowedFormats;
		}

		deprecated( 'wp.blockEditor.RichText formattingControls prop', {
			alternative: 'allowedFormats',
		} );

		return formattingControls.map( ( name ) => `core/${ name }` );
	};

	const multilineTag = getMultilineTag( multiline );
	const adjustedAllowedFormats = getAllowedFormats();
	const hasFormats = ! adjustedAllowedFormats || adjustedAllowedFormats.length > 0;
	let adjustedValue = originalValue;
	let adjustedOnChange = originalOnChange;

	// Handle deprecated format.
	if ( Array.isArray( originalValue ) ) {
		adjustedValue = childrenSource.toHTML( originalValue );
		adjustedOnChange = ( newValue ) => originalOnChange( childrenSource.fromDOM(
			__unstableCreateElement( document, newValue ).childNodes
		) );
	}

	const content = (
		<RichText
			{ ...experimentalProps }
			value={ adjustedValue }
			onChange={ adjustedOnChange }
			selectionStart={ selectionStart }
			selectionEnd={ selectionEnd }
			onSelectionChange={ onSelectionChange }
			tagName={ tagName }
			className={ classnames( classes, className, { 'is-selected': originalIsSelected } ) }
			placeholder={ placeholder }
			allowedFormats={ adjustedAllowedFormats }
			withoutInteractiveFormatting={ withoutInteractiveFormatting }
			onEnter={ onEnter }
			onDelete={ onDelete }
			onPaste={ onPaste }
			__unstableIsSelected={ originalIsSelected }
			__unstableInputRule={ inputRule }
			__unstableMultilineTag={ multilineTag }
			__unstableIsCaretWithinFormattedText={ isCaretWithinFormattedText }
			__unstableOnEnterFormattedText={ onEnterFormattedText }
			__unstableOnExitFormattedText={ onExitFormattedText }
			__unstableOnCreateUndoLevel={ onCreateUndoLevel }
		>
			{ ( { isSelected, value, onChange, Editable } ) =>
				<>
					{ isSelected && children && children( { value, onChange } ) }
					{ isSelected && ! inlineToolbar && hasFormats && (
						<BlockFormatControls>
							<FormatToolbar />
						</BlockFormatControls>
					) }
					{ isSelected && inlineToolbar && hasFormats && (
						<IsolatedEventContainer
							className="editor-rich-text__inline-toolbar block-editor-rich-text__inline-toolbar"
						>
							<FormatToolbar />
						</IsolatedEventContainer>
					) }
					{ isSelected && <RemoveBrowserShortcuts /> }
					<Autocomplete
						onReplace={ onReplace }
						completers={ autocompleters }
						record={ value }
						onChange={ onChange }
					>
						{ ( { listBoxId, activeId } ) =>
							<Editable
								aria-autocomplete={ listBoxId ? 'list' : undefined }
								aria-owns={ listBoxId }
								aria-activedescendant={ activeId }
							/>
						}
					</Autocomplete>
				</>
			}
		</RichText>
	);

	return (
		<div className={ classnames( wrapperClasses, wrapperClassName ) }>
			{ content }
		</div>
	);
}

const RichTextContainer = compose( [
	withInstanceId,
	withBlockEditContext( ( { clientId } ) => ( { clientId } ) ),
	withFilters( 'experimentalRichText' ),
] )( RichTextWrapper );

RichTextContainer.Content = ( { value, tagName: Tag, multiline, ...props } ) => {
	// Handle deprecated `children` and `node` sources.
	if ( Array.isArray( value ) ) {
		value = childrenSource.toHTML( value );
	}

	const MultilineTag = getMultilineTag( multiline );

	if ( ! value && MultilineTag ) {
		value = `<${ MultilineTag }></${ MultilineTag }>`;
	}

	const content = <RawHTML>{ value }</RawHTML>;

	if ( Tag ) {
		return <Tag { ...omit( props, [ 'format' ] ) }>{ content }</Tag>;
	}

	return content;
};

RichTextContainer.isEmpty = ( value ) => {
	return ! value || value.length === 0;
};

RichTextContainer.Content.defaultProps = {
	format: 'string',
	value: '',
};

/**
 * @see https://github.com/WordPress/gutenberg/blob/master/packages/block-editor/src/components/rich-text/README.md
 */
export default RichTextContainer;
export { RichTextShortcut } from './shortcut';
export { RichTextToolbarButton } from './toolbar-button';
export { __unstableRichTextInputEvent } from './input-event';
