/**
 * External dependencies
 */
import classnames from 'classnames';
import { omit } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component, RawHTML } from '@wordpress/element';
import { withDispatch, withSelect } from '@wordpress/data';
import { pasteHandler, children } from '@wordpress/blocks';
import { withInstanceId, compose } from '@wordpress/compose';
import { RichText, __unstableCreateElement } from '@wordpress/rich-text';
import { withFilters, IsolatedEventContainer } from '@wordpress/components';

/**
 * Internal dependencies
 */
import Autocomplete from '../autocomplete';
import BlockFormatControls from '../block-format-controls';
import FormatToolbar from './format-toolbar';
import { getPatterns, getEnterPatterns } from './patterns';
import { withBlockEditContext } from '../block-edit/context';
import { ListEdit } from './list-edit';
import { RemoveBrowserShortcuts } from './remove-browser-shortcuts';

const wrapperClasses = 'editor-rich-text block-editor-rich-text';
const classes = 'editor-rich-text__editable block-editor-rich-text__editable';

class RichTextWraper extends Component {
	constructor( { value } ) {
		super( ...arguments );

		this.usedDeprecatedChildrenSource = Array.isArray( value );
	}

	render() {
		const {
			tagName,
			multiline,
			onTagNameChange,
			inlineToolbar,
			wrapperClassName,
			className,
		} = this.props;

		let _value = this.props.value;
		let _onChange = this.props.onChange;

		if ( this.usedDeprecatedChildrenSource ) {
			_value = children.toHTML( this.props.value );
			_onChange = ( newValue ) => this.props.onChange( children.fromDOM(
				__unstableCreateElement( document, newValue ).childNodes
			) );
		}

		return (
			<RichText
				{ ...this.props }
				value={ _value }
				onChange={ _onChange }
				wrapperClassName={ classnames( wrapperClasses, wrapperClassName ) }
				className={ classnames( classes, className ) }
				__unstablePatterns={ getPatterns() }
				__unstableEnterPatterns={ getEnterPatterns() }
				__unstablePasteHandler={ pasteHandler }
				__unstableAutocomplete={ Autocomplete }
			>
				{ ( { isSelected, value, onChange } ) => (
					<>
						{ isSelected && multiline === 'li' && (
							<ListEdit
								onTagNameChange={ onTagNameChange }
								tagName={ tagName }
								value={ value }
								onChange={ onChange }
							/>
						) }
						{ isSelected && ! inlineToolbar && (
							<BlockFormatControls>
								<FormatToolbar />
							</BlockFormatControls>
						) }
						{ inlineToolbar && (
							<IsolatedEventContainer>
								<FormatToolbar />
							</IsolatedEventContainer>
						) }
						{ isSelected && <RemoveBrowserShortcuts /> }
					</>
				) }
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
		// This should probably be moved to the block editor settings.
		const { canUserUseUnfilteredHTML } = select( 'core/editor' );
		const {
			isCaretWithinFormattedText,
			getSelectionStart,
			getSelectionEnd,
		} = select( 'core/block-editor' );

		const selectionStart = getSelectionStart();
		const selectionEnd = getSelectionEnd();

		if ( isSelected === undefined ) {
			isSelected = (
				selectionStart.clientId === clientId &&
				selectionStart.attributeKey === identifier
			);
		}

		return {
			canUserUseUnfilteredHTML: canUserUseUnfilteredHTML(),
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
] )( RichTextWraper );

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
