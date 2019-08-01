/**
 * External dependencies
 */
import classnames from 'classnames';
import { omit } from 'lodash';

/**
 * WordPress dependencies
 */
import { RawHTML, Component } from '@wordpress/element';
import { withDispatch, withSelect } from '@wordpress/data';
import { pasteHandler, children, getBlockTransforms, findTransform } from '@wordpress/blocks';
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
import { ListEdit } from './list-edit';
import { RemoveBrowserShortcuts } from './remove-browser-shortcuts';

const wrapperClasses = 'editor-rich-text block-editor-rich-text';
const classes = 'editor-rich-text__editable block-editor-rich-text__editable';

class RichTextWrapper extends Component {
	constructor() {
		super( ...arguments );
		this.onEnter = this.onEnter.bind( this );
		this.onSplit = this.onSplit.bind( this );
		this.onPaste = this.onPaste.bind( this );
		this.onDelete = this.onDelete.bind( this );
		this.inputRule = this.inputRule.bind( this );
	}

	onEnter( { value, onChange, shiftKey } ) {
		const { onReplace, onSplit, multiline } = this.props;
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
				this.onSplit( value );
			} else {
				onChange( insertLineSeparator( value ) );
			}
		} else if ( shiftKey || ! canSplit ) {
			onChange( insert( value, '\n' ) );
		} else {
			this.onSplit( value );
		}
	}

	onDelete( { value, isReverse } ) {
		const { onMerge, onRemove } = this.props;

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
	}

	onPaste( { value, onChange, html, plainText, image } ) {
		const { onReplace, onSplit, tagName, canUserUseUnfilteredHTML } = this.props;

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
				this.onSplit( value, content );
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
			if ( this.multilineTag ) {
				valueToInsert = replace( valueToInsert, /\n+/g, LINE_SEPARATOR );
			}

			onChange( insert( value, valueToInsert ) );
		} else if ( content.length > 0 ) {
			if ( canReplace ) {
				onReplace( content );
			} else {
				this.onSplit( value, content );
			}
		}
	}

	/**
	 * Signals to the RichText owner that the block can be replaced with two
	 * blocks as a result of splitting the block by pressing enter, or with
	 * blocks as a result of splitting the block by pasting block content in the
	 * instance.
	 *
	 * @param  {Object} record       The rich text value to split.
	 * @param  {Array}  pastedBlocks The pasted blocks to insert, if any.
	 */
	onSplit( record, pastedBlocks = [] ) {
		const {
			onReplace,
			onSplit,
			__unstableOnSplitMiddle: onSplitMiddle,
			multiline,
		} = this.props;

		if ( ! onReplace || ! onSplit ) {
			return;
		}

		const blocks = [];
		const [ before, after ] = split( record );
		const hasPastedBlocks = pastedBlocks.length > 0;

		// Create a block with the content before the caret if there's no pasted
		// blocks, or if there are pasted blocks and the value is not empty.
		// We do not want a leading empty block on paste, but we do if split
		// with e.g. the enter key.
		if ( ! hasPastedBlocks || ! isEmpty( before ) ) {
			blocks.push( onSplit( toHTMLString( {
				value: before,
				multilineTag: multiline,
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
				multilineTag: multiline,
			} ) ) );
		}

		// If there are pasted blocks, set the selection to the last one.
		// Otherwise, set the selection to the second block.
		const indexToSelect = hasPastedBlocks ? blocks.length - 1 : 1;

		onReplace( blocks, indexToSelect );
	}

	inputRule( value, valueToFormat ) {
		const { onReplace } = this.props;

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
	}

	getAllowedFormats() {
		const { allowedFormats, formattingControls } = this.props;

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
	}

	render() {
		const {
			tagName,
			value: originalValue,
			onChange: originalOnChange,
			selectionStart,
			selectionEnd,
			onSelectionChange,
			multiline,
			onTagNameChange,
			inlineToolbar,
			wrapperClassName,
			className,
			autocompleters,
			onReplace,
			isCaretWithinFormattedText,
			onEnterFormattedText,
			onExitFormattedText,
			isSelected: originalIsSelected,
			onCreateUndoLevel,
			placeholder,
			// eslint-disable-next-line no-unused-vars
			allowedFormats,
			withoutInteractiveFormatting,
			// eslint-disable-next-line no-unused-vars
			onRemove,
			// eslint-disable-next-line no-unused-vars
			onMerge,
			// eslint-disable-next-line no-unused-vars
			onSplit,
			// eslint-disable-next-line no-unused-vars
			canUserUseUnfilteredHTML,
			// eslint-disable-next-line no-unused-vars
			clientId,
			// eslint-disable-next-line no-unused-vars
			identifier,
			// eslint-disable-next-line no-unused-vars
			instanceId,
			// From experimental filter. To do: pick props instead.
			...experimentalProps
		} = this.props;

		const adjustedAllowedFormats = this.getAllowedFormats();
		const hasFormats = ! adjustedAllowedFormats || adjustedAllowedFormats.length > 0;
		let adjustedValue = originalValue;
		let adjustedOnChange = originalOnChange;

		// Handle deprecated format.
		if ( Array.isArray( originalValue ) ) {
			adjustedValue = children.toHTML( originalValue );
			adjustedOnChange = ( newValue ) => originalOnChange( children.fromDOM(
				__unstableCreateElement( document, newValue ).childNodes
			) );
		}

		return (
			<RichText
				{ ...experimentalProps }
				value={ adjustedValue }
				onChange={ adjustedOnChange }
				selectionStart={ selectionStart }
				selectionEnd={ selectionEnd }
				onSelectionChange={ onSelectionChange }
				tagName={ tagName }
				wrapperClassName={ classnames( wrapperClasses, wrapperClassName ) }
				className={ classnames( classes, className, { 'is-selected': originalIsSelected } ) }
				placeholder={ placeholder }
				allowedFormats={ adjustedAllowedFormats }
				withoutInteractiveFormatting={ withoutInteractiveFormatting }
				onEnter={ this.onEnter }
				onDelete={ this.onDelete }
				onPaste={ this.onPaste }
				__unstableIsSelected={ originalIsSelected }
				__unstableInputRule={ this.inputRule }
				__unstableAutocomplete={ Autocomplete }
				__unstableAutocompleters={ autocompleters }
				__unstableOnReplace={ onReplace }
				__unstableMultiline={ multiline }
				__unstableIsCaretWithinFormattedText={ isCaretWithinFormattedText }
				__unstableOnEnterFormattedText={ onEnterFormattedText }
				__unstableOnExitFormattedText={ onExitFormattedText }
				__unstableOnCreateUndoLevel={ onCreateUndoLevel }
			>
				{ ( { isSelected, value, onChange } ) =>
					<>
						{ isSelected && multiline === 'li' && (
							<ListEdit
								onTagNameChange={ onTagNameChange }
								tagName={ tagName }
								value={ value }
								onChange={ onChange }
							/>
						) }
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
					</>
				}
			</RichText>
		);
	}
}

const RichTextContainer = compose( [
	withInstanceId,
	withBlockEditContext( ( { clientId } ) => ( { clientId } ) ),
	withSelect( ( select, {
		clientId,
		instanceId,
		identifier = instanceId,
		isSelected,
	} ) => {
		const {
			isCaretWithinFormattedText,
			getSelectionStart,
			getSelectionEnd,
			getSettings,
		} = select( 'core/block-editor' );

		const selectionStart = getSelectionStart();
		const selectionEnd = getSelectionEnd();
		const { __experimentalCanUserUseUnfilteredHTML } = getSettings();
		if ( isSelected === undefined ) {
			isSelected = (
				selectionStart.clientId === clientId &&
				selectionStart.attributeKey === identifier
			);
		}

		return {
			canUserUseUnfilteredHTML: __experimentalCanUserUseUnfilteredHTML,
			isCaretWithinFormattedText: isCaretWithinFormattedText(),
			selectionStart: isSelected ? selectionStart.offset : undefined,
			selectionEnd: isSelected ? selectionEnd.offset : undefined,
			isSelected,
		};
	} ),
	withDispatch( ( dispatch, {
		clientId,
		instanceId,
		identifier = instanceId,
	} ) => {
		const {
			__unstableMarkLastChangeAsPersistent,
			enterFormattedText,
			exitFormattedText,
			selectionChange,
		} = dispatch( 'core/block-editor' );

		return {
			onCreateUndoLevel: __unstableMarkLastChangeAsPersistent,
			onEnterFormattedText: enterFormattedText,
			onExitFormattedText: exitFormattedText,
			onSelectionChange( start, end ) {
				selectionChange( clientId, identifier, start, end );
			},
		};
	} ),
	withFilters( 'experimentalRichText' ),
] )( RichTextWrapper );

RichTextContainer.Content = ( { value, tagName: Tag, multiline, ...props } ) => {
	let html = value;
	let MultilineTag;

	if ( multiline === true || multiline === 'p' || multiline === 'li' ) {
		MultilineTag = multiline === true ? 'p' : multiline;
	}

	// Handle deprecated `children` and `node` sources.
	if ( Array.isArray( value ) ) {
		html = children.toHTML( value );
	}

	if ( ! html && MultilineTag ) {
		html = `<${ MultilineTag }></${ MultilineTag }>`;
	}

	const content = <RawHTML>{ html }</RawHTML>;

	if ( Tag ) {
		return <Tag { ...omit( props, [ 'format' ] ) }>{ content }</Tag>;
	}

	return content;
};

RichTextContainer.isEmpty = ( value = '' ) => {
	// Handle deprecated `children` and `node` sources.
	if ( Array.isArray( value ) ) {
		return ! value || value.length === 0;
	}

	return value.length === 0;
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
