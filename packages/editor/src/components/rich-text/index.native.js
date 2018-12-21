/**
 * External dependencies
 */
import RCTAztecView from 'react-native-aztec';
import { View, Platform } from 'react-native';

/**
 * WordPress dependencies
 */
import { Component, RawHTML } from '@wordpress/element';
import { withInstanceId, compose } from '@wordpress/compose';
import { BlockFormatControls } from '@wordpress/editor';
import { withSelect } from '@wordpress/data';
import {
	getActiveFormat,
	isEmpty,
	create,
	split,
	toHTMLString,
} from '@wordpress/rich-text';
import { BACKSPACE } from '@wordpress/keycodes';
import { children } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import FormatEdit from './format-edit';
import FormatToolbar from './format-toolbar';

const isRichTextValueEmpty = ( value ) => {
	return ! value || ! value.length;
};

const gutenbergFormatNamesToAztec = {
	'core/bold': 'bold',
	'core/italic': 'italic',
	'core/strikethrough': 'strikethrough',
};

export class RichText extends Component {
	constructor() {
		super( ...arguments );
		this.isIOS = Platform.OS === 'ios';
		this.onChange = this.onChange.bind( this );
		this.onEnter = this.onEnter.bind( this );
		this.onBackspace = this.onBackspace.bind( this );
		this.onContentSizeChange = this.onContentSizeChange.bind( this );
		this.onFormatChange = this.onFormatChange.bind( this );
		this.onSelectionChange = this.onSelectionChange.bind( this );
		this.valueToFormat = this.valueToFormat.bind( this );
		this.state = {
			start: 0,
			end: 0,
			formatPlaceholder: null,
		};
	}

	/**
	 * Get the current record (value and selection) from props and state.
	 *
	 * @return {Object} The current record (value and selection).
	 */
	getRecord() {
		const { formatPlaceholder, start, end, lastValue } = this.state;
		// Since we get the text selection from Aztec we need to be in sync with the HTML `value`
		// Removing the leading or the trailing white spaces using `trim()` should make sure this is the case
		const { formats, text } = this.formatToValue( lastValue || this.props.value.trim() );

		return { formats, formatPlaceholder, text, start, end };
	}

	/*
	 * Splits the content at the location of the selection.
	 *
	 * Replaces the content of the editor inside this element with the contents
	 * before the selection. Sends the elements after the selection to the `onSplit`
	 * handler.
	 *
	 */
	splitContent( htmlText, start, end ) {
		const { onSplit } = this.props;

		if ( ! onSplit ) {
			return;
		}

		const record = create( {
			html: htmlText,
			range: null,
			multilineTag: false,
			removeNode: null,
			unwrapNode: null,
			removeAttribute: null,
			filterString: null,
		} );

		// TODO : Fix the index position in AztecNative for Android
		let [ before, after ] = split( { start, end, ...record } );

		// In case split occurs at the trailing or leading edge of the field,
		// assume that the before/after values respectively reflect the current
		// value. This also provides an opportunity for the parent component to
		// determine whether the before/after value has changed using a trivial
		//  strict equality operation.
		if ( isEmpty( after ) ) {
			before = record;
		} else if ( isEmpty( before ) ) {
			after = record;
		}

		if ( before ) {
			before = this.valueToFormat( before );
		}

		if ( after ) {
			after = this.valueToFormat( after );
		}

		// The onSplit event can cause a content update event for this block.  Such event should
		// definitely be processed by our native components, since they have no knowledge of
		// how the split works.  Setting lastEventCount to undefined forces the native component to
		// always update when provided with new content.
		this.lastEventCount = undefined;

		onSplit( before, after );
	}

	valueToFormat( { formats, formatPlaceholder, text } ) {
		const value = toHTMLString( {
			value: { formats, formatPlaceholder, text },
			multilineTag: this.multilineTag,
		} );
		// remove the outer root tags
		return this.removeRootTagsProduceByAztec( value );
	}

	getActiveFormatNames( record ) {
		const {
			formatTypes,
		} = this.props;

		return formatTypes.map( ( { name } ) => name ).filter( ( name ) => {
			return getActiveFormat( record, name ) !== undefined;
		} ).map( ( name ) => gutenbergFormatNamesToAztec[ name ] );
	}

	onFormatChange( record ) {
		const newContent = this.valueToFormat( record );
		this.props.onChange( newContent );
		this.setState( {
			formatPlaceholder: record.formatPlaceholder,
			lastValue: null,
		} );
	}

	/*
	 * Cleans up any root tags produced by aztec.
	 * TODO: This should be removed on a later version when aztec doesn't return the top tag of the text being edited
	 */

	removeRootTagsProduceByAztec( html ) {
		const openingTagRegexp = RegExp( '^<' + this.props.tagName + '>', 'gim' );
		const closingTagRegexp = RegExp( '</' + this.props.tagName + '>$', 'gim' );
		return html.replace( openingTagRegexp, '' ).replace( closingTagRegexp, '' );
	}

	/*
	 * Handles any case where the content of the AztecRN instance has changed
	 */
	onChange( event ) {
		this.lastEventCount = event.nativeEvent.eventCount;
		const contentWithoutRootTag = this.removeRootTagsProduceByAztec( event.nativeEvent.text );
		this.lastContent = contentWithoutRootTag;
		this.props.onChange( this.lastContent );
	}

	/**
	 * Handles any case where the content of the AztecRN instance has changed in size
	 */

	onContentSizeChange( contentSize ) {
		const contentHeight = contentSize.height;
		this.forceUpdate(); // force re-render the component skipping shouldComponentUpdate() See: https://reactjs.org/docs/react-component.html#forceupdate
		this.props.onContentSizeChange( {
			aztecHeight: contentHeight,
		} );
	}

	// eslint-disable-next-line no-unused-vars
	onEnter( event ) {
		if ( ! this.props.onSplit ) {
			// TODO: insert the \n char instead?
			return;
		}

		this.splitContent( event.nativeEvent.text, event.nativeEvent.selectionStart, event.nativeEvent.selectionEnd );
	}

	// eslint-disable-next-line no-unused-vars
	onBackspace( event ) {
		const { onMerge, onRemove } = this.props;
		if ( ! onMerge && ! onRemove ) {
			return;
		}

		const keyCode = BACKSPACE; // TODO : should we differentiate BACKSPACE and DELETE?
		const isReverse = keyCode === BACKSPACE;

		const empty = this.isEmpty();

		if ( onMerge ) {
			onMerge( ! isReverse );
		}

		// Only handle remove on Backspace. This serves dual-purpose of being
		// an intentional user interaction distinguishing between Backspace and
		// Delete to remove the empty field, but also to avoid merge & remove
		// causing destruction of two fields (merge, then removed merged).
		if ( onRemove && empty && isReverse ) {
			onRemove( ! isReverse );
		}
	}

	onSelectionChange( start, end, text ) {
		// `end` can be less than `start` on iOS
		// Let's fix that here so `rich-text/slice` can work properly
		const realStart = Math.min( start, end );
		const realEnd = Math.max( start, end );
		this.setState( {
			start: realStart,
			end: realEnd,
			formatPlaceholder: null,
			lastValue: text,
		} );
	}

	isEmpty() {
		return isEmpty( this.formatToValue( this.props.value ) );
	}

	formatToValue( value ) {
		// Handle deprecated `children` and `node` sources.
		if ( Array.isArray( value ) ) {
			return create( {
				html: children.toHTML( value ),
				multilineTag: this.multilineTag,
			} );
		}

		if ( this.props.format === 'string' ) {
			return create( {
				html: value,
				multilineTag: this.multilineTag,
			} );
		}

		// Guard for blocks passing `null` in onSplit callbacks. May be removed
		// if onSplit is revised to not pass a `null` value.
		if ( value === null ) {
			return create();
		}

		return value;
	}

	shouldComponentUpdate( nextProps ) {
		if ( nextProps.tagName !== this.props.tagName || nextProps.isSelected !== this.props.isSelected ) {
			this.lastEventCount = undefined;
			this.lastContent = undefined;
			return true;
		}

		// TODO: Please re-introduce the check to avoid updating the content right after an `onChange` call.
		// It was removed in https://github.com/WordPress/gutenberg/pull/12417 to fix undo/redo problem.

		// If the component is changed React side (undo/redo/merging/splitting/custom text actions)
		// we need to make sure the native is updated as well
		if ( ( typeof nextProps.value !== 'undefined' ) &&
			( typeof this.lastContent !== 'undefined' ) &&
			nextProps.value !== this.lastContent ) {
			this.lastEventCount = undefined; // force a refresh on the native side
		}

		return true;
	}

	componentDidMount() {
		if ( this.props.isSelected ) {
			this._editor.focus();
		}
	}

	componentWillUnmount() {
		if ( this._editor.isFocused() ) {
			this._editor.blur();
		}
	}

	componentDidUpdate( prevProps ) {
		if ( this.props.isSelected && ! prevProps.isSelected ) {
			this._editor.focus();
		} else if ( ! this.props.isSelected && prevProps.isSelected && this.isIOS ) {
			this._editor.blur();
		}
	}

	render() {
		const {
			tagName,
			style,
			formattingControls,
			isSelected,
		} = this.props;

		const record = this.getRecord();
		// Save back to HTML from React tree
		const html = `<${ tagName }>${ this.valueToFormat( record ) }</${ tagName }>`;

		return (
			<View>
				{ isSelected && (
					<BlockFormatControls>
						<FormatToolbar controls={ formattingControls } />
					</BlockFormatControls>
				) }
				<RCTAztecView
					ref={ ( ref ) => {
						this._editor = ref;
					} }
					text={ { text: html, eventCount: this.lastEventCount } }
					onChange={ this.onChange }
					onFocus={ this.props.onFocus }
					onBlur={ this.props.onBlur }
					onEnter={ this.onEnter }
					onBackspace={ this.onBackspace }
					activeFormats={ this.getActiveFormatNames( record ) }
					onContentSizeChange={ this.onContentSizeChange }
					onCaretVerticalPositionChange={ this.props.onCaretVerticalPositionChange }
					onSelectionChange={ this.onSelectionChange }
					isSelected={ isSelected }
					blockType={ { tag: tagName } }
					color={ 'black' }
					maxImagesWidth={ 200 }
					style={ style }
				/>
				{ isSelected && <FormatEdit value={ record } onChange={ this.onFormatChange } /> }
			</View>
		);
	}
}

RichText.defaultProps = {
	formattingControls: [ 'bold', 'italic', 'link', 'strikethrough' ],
	format: 'string',
};

const RichTextContainer = compose( [
	withInstanceId,
	withSelect( ( select ) => {
		const { getFormatTypes } = select( 'core/rich-text' );

		return {
			formatTypes: getFormatTypes(),
		};
	} ),
] )( RichText );

RichTextContainer.Content = ( { value, format, tagName: Tag, ...props } ) => {
	let content;
	switch ( format ) {
		case 'string':
			content = <RawHTML>{ value }</RawHTML>;
			break;
	}

	if ( Tag ) {
		return <Tag { ...props }>{ content }</Tag>;
	}

	return content;
};

RichTextContainer.isEmpty = isRichTextValueEmpty;

RichTextContainer.Content.defaultProps = {
	format: 'string',
};

export default RichTextContainer;
export { RichTextShortcut } from './shortcut';
export { RichTextToolbarButton } from './toolbar-button';
