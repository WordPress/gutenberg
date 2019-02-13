/**
 * External dependencies
 */
import RCTAztecView from 'react-native-aztec';
import { View, Platform } from 'react-native';
import {
	forEach,
	merge,
} from 'lodash';

/**
 * WordPress dependencies
 */
import { Component, RawHTML } from '@wordpress/element';
import { withInstanceId, compose } from '@wordpress/compose';
import { Toolbar } from '@wordpress/components';
import { BlockFormatControls } from '@wordpress/editor';
import {
	applyFormat,
	isEmpty,
	create,
	split,
	toHTMLString,
	insert,
	isCollapsed,
} from '@wordpress/rich-text';
import { decodeEntities } from '@wordpress/html-entities';
import { BACKSPACE } from '@wordpress/keycodes';
import { pasteHandler, children } from '@wordpress/blocks';
import { isURL } from '@wordpress/url';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import styles from './style.scss';

const FORMATTING_CONTROLS = [
	{
		icon: 'editor-bold',
		title: __( 'Bold' ),
		format: 'bold',
	},
	{
		icon: 'editor-italic',
		title: __( 'Italic' ),
		format: 'italic',
	},
	// TODO: get this back after alpha
	// {
	// 	icon: 'admin-links',
	// 	title: __( 'Link' ),
	// 	format: 'link',
	// },
	{
		icon: 'editor-strikethrough',
		title: __( 'Strikethrough' ),
		format: 'strikethrough',
	},
];

const isRichTextValueEmpty = ( value ) => {
	return ! value || ! value.length;
};

export function getFormatValue( formatName ) {
	if ( 'link' === formatName ) {
		//TODO: Implement link command
	}
	return { isActive: true };
}

export class RichText extends Component {
	constructor() {
		super( ...arguments );
		this.isIOS = Platform.OS === 'ios';
		this.onChange = this.onChange.bind( this );
		this.onEnter = this.onEnter.bind( this );
		this.onBackspace = this.onBackspace.bind( this );
		this.onPaste = this.onPaste.bind( this );
		this.onContentSizeChange = this.onContentSizeChange.bind( this );
		this.changeFormats = this.changeFormats.bind( this );
		this.toggleFormat = this.toggleFormat.bind( this );
		this.onActiveFormatsChange = this.onActiveFormatsChange.bind( this );
		this.isEmpty = this.isEmpty.bind( this );
		this.valueToFormat = this.valueToFormat.bind( this );
		this.state = {
			formats: {},
			selectedNodeId: 0,
		};
	}

	/*
	 * Splits the content at the location of the selection.
	 *
	 * Replaces the content of the editor inside this element with the contents
	 * before the selection. Sends the elements after the selection to the `onSplit`
	 * handler.
	 *
	 */
	splitContent( currentRecord, blocks = [] , isPasted = false ) {
		const { onSplit } = this.props;

		if ( ! onSplit ) {
			return;
		}

		// TODO : Fix the index position in AztecNative for Android
		let [ before, after ] = split( currentRecord );

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

		// If pasting and the split would result in no content other than the
		// pasted blocks, remove the before and after blocks.
		if ( isPasted ) {
			before = isEmpty( before ) ? null : before;
			after = isEmpty( after ) ? null : after;
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

		onSplit( before, after, ...blocks );
	}

	valueToFormat( { formats, text } ) {
		const value = toHTMLString( {
			value: { formats, text },
			multilineTag: this.multilineTag,
		} );
		// remove the outer root tags
		return this.removeRootTagsProduceByAztec( value );
	}

	onActiveFormatsChange( formats ) {
		// force re-render the component skipping shouldComponentUpdate() See: https://reactjs.org/docs/react-component.html#forceupdate
		// This is needed because our shouldComponentUpdate impl. doesn't take in consideration props yet.
		this.forceUpdate();
		const newFormats = formats.reduce( ( accFormats, activeFormat ) => {
			accFormats[ activeFormat ] = getFormatValue( activeFormat );
			return accFormats;
		}, {} );

		this.setState( {
			formats: merge( {}, newFormats ),
			selectedNodeId: this.state.selectedNodeId + 1,
		} );
	}

	/*
	 * Cleans up any root tags produced by aztec.
	 * TODO: This should be removed on a later version when aztec doesn't return the top tag of the text being edited
	 */

	removeRootTagsProduceByAztec( html ) {
		let result = this.removeRootTag( this.props.tagName, html );
		// Temporary workaround for https://github.com/WordPress/gutenberg/pull/13763
		if ( this.props.rootTagsToEliminate ) {
			this.props.rootTagsToEliminate.forEach( ( element ) => {
				result = this.removeRootTag( element, result );
			} );
		}
		return result;
	}

	removeRootTag( tag, html ) {
		const openingTagRegexp = RegExp( '^<' + tag + '>', 'gim' );
		const closingTagRegexp = RegExp( '</' + tag + '>$', 'gim' );
		return html.replace( openingTagRegexp, '' ).replace( closingTagRegexp, '' );
	}

	/**
	 * Handles any case where the content of the AztecRN instance has changed
	 */

	onChange( event ) {
		this.lastEventCount = event.nativeEvent.eventCount;
		const contentWithoutRootTag = this.removeRootTagsProduceByAztec( event.nativeEvent.text );
		this.lastContent = contentWithoutRootTag;
		this.props.onChange( {
			content: this.lastContent,
		} );
	}

	/**
	 * Handles any case where the content of the AztecRN instance has changed in size
	 */

	onContentSizeChange( contentSize ) {
		const contentHeight = contentSize.height;
		this.props.onContentSizeChange( {
			aztecHeight: contentHeight,
		}
		);
	}

	// eslint-disable-next-line no-unused-vars
	onEnter( event ) {
		if ( ! this.props.onSplit ) {
			// TODO: insert the \n char instead?
			return;
		}

		const currentRecord = this.createRecord( {
			...event.nativeEvent,
			currentContent: event.nativeEvent.text,
		} );

		this.splitContent( currentRecord );
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

	/**
	 * Handles a paste event from the native Aztec Wrapper.
	 *
	 * @param {PasteEvent} event The paste event which wraps `nativeEvent`.
	 */
	onPaste( event ) {
		const isPasted = true;
		const { onSplit } = this.props;

		const { pastedText, pastedHtml } = event.nativeEvent;
		const currentRecord = this.createRecord( event.nativeEvent );

		event.preventDefault();

		// There is a selection, check if a URL is pasted.
		if (!isCollapsed(currentRecord)) {
			const trimmedText = (pastedHtml || pastedText).replace(/<[^>]+>/g, '')
				.trim();

			// A URL was pasted, turn the selection into a link
			if ( isURL( trimmedText ) ) {

				const linkedRecord = applyFormat( currentRecord, {
					type: 'a',
					attributes: {
						href: decodeEntities( trimmedText ),
					},
				} );
				this.lastContent = this.valueToFormat( linkedRecord );
 				this.props.onChange({
					content: this.lastContent,
				});

				// Allows us to ask for this information when we get a report.
				window.console.log( 'Created link:\n\n', trimmedText );

				return;
			}
		}

		const shouldReplace = this.props.onReplace && this.isEmpty();

		let mode = 'INLINE';

		if ( shouldReplace ) {
			mode = 'BLOCKS';
		} else if ( onSplit ) {
			mode = 'AUTO';
		}

		const pastedContent = pasteHandler( {
			HTML: pastedHtml,
			plainText: pastedText,
			mode,
			tagName: this.props.tagName,
			canUserUseUnfilteredHTML: this.props.canUserUseUnfilteredHTML,
		} );

		if ( typeof pastedContent === 'string' ) {
			const recordToInsert = create( { html: pastedContent } );
			// this.onChange( insert( currentRecord, recordToInsert ) );
			this.lastEventCount = undefined;
			const insertedContent = insert( currentRecord, recordToInsert );
			const newContent = this.valueToFormat( insertedContent );
			this.lastContent = newContent;
			this.props.onChange({
				content: this.lastContent,
			});
		} else if ( onSplit ) {
			if ( ! pastedContent.length ) {
				return;
			}

			if ( shouldReplace ) {
				this.props.onReplace( pastedContent );
			} else {
				this.splitContent( currentRecord, pastedContent, isPasted );
			}
		}
	}

	isEmpty() {
		return isEmpty( this.formatToValue( this.props.value ) );
	}

	/**
	 * Creates a RichText value "record" from native content and selection
	 * information
	 *
	 * @param {String} currentContent The content (usually an HTML string) from
	 *                                the native component.
	 * @param {int}    selectionStart The start of the selection.
	 * @param {int}      selectionEnd The end of the selection (same as start if 
	 *                                cursor instead of selection).
	 * 
   * @return {Object} A RichText value with formats and selection.
	 */
	createRecord( { currentContent, selectionStart, selectionEnd } ) {
		// strip outer <p> tags
		const innerContent = this.removeRootTagsProduceByAztec(currentContent);

		// create record (with selection) from current contents
		const currentRecord = {
			start: selectionStart,
			end: selectionEnd,
			...create({
				html: innerContent,
				range: null,
				multilineTag: false,
				removeNode: null,
				unwrapNode: null,
				removeAttribute: null,
				filterString: null,
			})
		};

		return currentRecord;
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
		if ( nextProps.tagName !== this.props.tagName ) {
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

	isFormatActive( format ) {
		return this.state.formats[ format ] && this.state.formats[ format ].isActive;
	}

	// eslint-disable-next-line no-unused-vars
	removeFormat( format ) {
		this._editor.applyFormat( format );
	}

	// eslint-disable-next-line no-unused-vars
	applyFormat( format, args, node ) {
		this._editor.applyFormat( format );
	}

	changeFormats( formats ) {
		const newStateFormats = {};
		forEach( formats, ( formatValue, format ) => {
			newStateFormats[ format ] = getFormatValue( format );
			const isActive = this.isFormatActive( format );
			if ( isActive && ! formatValue ) {
				this.removeFormat( format );
			} else if ( ! isActive && formatValue ) {
				this.applyFormat( format );
			}
		} );

		this.setState( ( state ) => ( {
			formats: merge( {}, state.formats, newStateFormats ),
		} ) );
	}

	toggleFormat( format ) {
		return () => this.changeFormats( {
			[ format ]: ! this.state.formats[ format ],
		} );
	}

	render() {
		const {
			tagName,
			style,
			formattingControls,
			value,
		} = this.props;

		const toolbarControls = FORMATTING_CONTROLS
			.filter( ( control ) => formattingControls.indexOf( control.format ) !== -1 )
			.map( ( control ) => ( {
				...control,
				onClick: this.toggleFormat( control.format ),
				isActive: this.isFormatActive( control.format ),
			} ) );

		// Save back to HTML from React tree
		let html = '<' + tagName + '>' + value + '</' + tagName + '>';
		// We need to check if the value is undefined or empty, and then assign it properly otherwise the placeholder is not visible
		if ( value === undefined || value === '' ) {
			html = '';
			this.lastEventCount = undefined; // force a refresh on the native side
		}

		return (
			<View>
				<BlockFormatControls>
					<Toolbar controls={ toolbarControls } />
				</BlockFormatControls>
				<RCTAztecView
					ref={ ( ref ) => {
						this._editor = ref;
					}
					}
					text={ { text: html, eventCount: this.lastEventCount } }
					placeholder={ this.props.placeholder }
					placeholderTextColor={ this.props.placeholderTextColor || 'lightgrey' }
					onChange={ this.onChange }
					onFocus={ this.props.onFocus }
					onBlur={ this.props.onBlur }
					onEnter={ this.onEnter }
					onBackspace={ this.onBackspace }
					onPaste={ this.onPaste }
					onContentSizeChange={ this.onContentSizeChange }
					onActiveFormatsChange={ this.onActiveFormatsChange }
					onCaretVerticalPositionChange={ this.props.onCaretVerticalPositionChange }
					isSelected={ this.props.isSelected }
					blockType={ { tag: tagName } }
					color={ 'black' }
					maxImagesWidth={ 200 }
					style={ style }
					fontFamily={ this.props.fontFamily || styles[ 'editor-rich-text' ].fontFamily }
					fontSize={ this.props.fontSize }
					fontWeight={ this.props.fontWeight }
					fontStyle={ this.props.fontStyle }
				/>
			</View>
		);
	}
}

RichText.defaultProps = {
	formattingControls: FORMATTING_CONTROLS.map( ( { format } ) => format ),
	format: 'string',
};

const RichTextContainer = compose( [
	withInstanceId,
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
