/**
 * External dependencies
 */
import RCTAztecView from 'react-native-aztec';
import { View } from 'react-native';
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
import {
	isEmpty,
	create,
	split,
	toHTMLString,
} from '@wordpress/rich-text';

/**
 * Internal dependencies
 */
import { FORMATTING_CONTROLS } from './formatting-controls';

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
		this.onChange = this.onChange.bind( this );
		this.onEnter = this.onEnter.bind( this );
		this.onContentSizeChange = this.onContentSizeChange.bind( this );
		this.changeFormats = this.changeFormats.bind( this );
		this.toggleFormat = this.toggleFormat.bind( this );
		this.onActiveFormatsChange = this.onActiveFormatsChange.bind( this );
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

	valueToFormat( { formats, text } ) {
		const value = toHTMLString( { formats, text }, this.multilineTag );
		// remove the outer p tags
		const returningContentWithoutParaTag = value.replace( /<p>|<\/p>/gi, '' );
		return returningContentWithoutParaTag;
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
	/**
	 * Handles any case where the content of the AztecRN instance has changed.
	 */

	onChange( event ) {
		// If we had a timer set to propagate a change, let's cancel it, because the user meanwhile typed something extra
		if ( !! this.currentTimer ) {
			clearTimeout( this.currentTimer );
		}
		this.lastEventCount = event.nativeEvent.eventCount;
		// The following method just cleans up any root tags produced by aztec and replaces them with a br tag
		// This should be removed on a later version when aztec doesn't return the top tag of the text being edited
		const openingTagRegexp = RegExp( '^<' + this.props.tagName + '>', 'gim' );
		const closingTagRegexp = RegExp( '</' + this.props.tagName + '>$', 'gim' );
		const contentWithoutRootTag = event.nativeEvent.text.replace( openingTagRegexp, '' ).replace( closingTagRegexp, '' );
		this.lastContent = contentWithoutRootTag;
		// Set a time to call the onChange prop if nothing changes in the next second
		this.currentTimer = setTimeout( function() {
			this.props.onChange( {
				content: this.lastContent,
			} );
		}.bind( this ), 1000 );
	}

	/**
	 * Handles any case where the content of the AztecRN instance has changed in size
	 */

	onContentSizeChange( contentSize ) {
		const contentHeight = contentSize.height;
		this.forceUpdate(); // force re-render the component skipping shouldComponentUpdate() See: https://reactjs.org/docs/react-component.html#forceupdate
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

		this.splitContent( event.nativeEvent.text, event.nativeEvent.selectionStart, event.nativeEvent.selectionEnd );
	}

	shouldComponentUpdate( nextProps ) {
		if ( nextProps.tagName !== this.props.tagName ) {
			this.lastEventCount = undefined;
			this.lastContent = undefined;
			return true;
		}
		// The check below allows us to avoid updating the content right after an `onChange` call
		// first time the component is drawn with empty content `lastContent` is undefined
		if ( nextProps.value &&
			this.lastContent &&
			this.lastEventCount ) {
			return false;
		}

		return true;
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
		const html = '<' + tagName + '>' + value + '</' + tagName + '>';

		return (
			<View>
				<View style={ { flex: 1 } }>
					<Toolbar controls={ toolbarControls } />
				</View>
				<RCTAztecView
					ref={ ( ref ) => {
						this._editor = ref;
					}
					}
					text={ { text: html, eventCount: this.lastEventCount } }
					onChange={ this.onChange }
					onEnter={ this.onEnter }
					onContentSizeChange={ this.onContentSizeChange }
					onActiveFormatsChange={ this.onActiveFormatsChange }
					color={ 'black' }
					maxImagesWidth={ 200 }
					style={ style }
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
