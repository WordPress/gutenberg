/**
 * External dependencies
 */
import RCTAztecView from 'react-native-aztec';

/**
 * WordPress dependencies
 */
import { Component, RawHTML, renderToString } from '@wordpress/element';
import { withInstanceId, compose } from '@wordpress/compose';
import { children } from '@wordpress/blocks';

export class RichText extends Component {
	constructor() {
		super( ...arguments );
		this.onChange = this.onChange.bind( this );
		this.onContentSizeChange = this.onContentSizeChange.bind( this );

		this.lastContentSizeHeight = -1;
		this.lastEventCount = 0;
	}

	/**
	 * Handles any case where the content of the AztecRN instance has changed.
	 */

	onChange( event ) {
		if ( !! this.currentTimer ) {
			clearTimeout( this.currentTimer );
		}
		this.lastEventCount = event.nativeEvent.eventCount;
		const newContent = event.nativeEvent.text.replace( /<p>/gi, '' ).replace( /<\/p>/gi, '<br>' );
		this.lastContent = newContent;

		this.currentTimer = setTimeout( function() {
			this.props.onChange( {
				content: this.lastContent,
				eventCount: this.lastEventCount,
			} );
		}.bind( this ), 1000 );
	}

	/**
	 * Handles any case where the content of the AztecRN instance has changed in size
	 */

	onContentSizeChange( event ) {
		this.lastContentSizeHeight = event.nativeEvent.contentSize.height;
		this.forceUpdate = true; // Set this to true and check it in shouldComponentUpdate to force re-render the component
		this.props.onContentSizeChange( {
			aztecHeight: this.lastContentSizeHeight,
		}
		);
	}

	shouldComponentUpdate( nextProps ) {
		if ( this.forceUpdate ) {
			this.forceUpdate = false;
			return true;
		}

		// The check below allows us to avoid updating the content right after an `onChange` call
		if ( nextProps.content.contentTree &&
			nextProps.content.eventCount &&
			this.lastContent && // first time the component is drawn with empty content `lastContent` is undefined
			this.lastEventCount &&
			nextProps.content.eventCount !== this.lastEventCount ) {
			return false;
		}

		return true;
	}

	render() {
		// Save back to HTML from React tree
		const html = renderToString( this.props.content.contentTree );
		const {
			style,
			eventCount,
		} = this.props;

		return (
			<RCTAztecView
				text={ { text: html, eventCount: eventCount } }
				onChange={ this.onChange }
				onContentSizeChange={ this.onContentSizeChange }
				color={ 'black' }
				maxImagesWidth={ 200 }
				style={ style }
			/>
		);
	}
}

const RichTextContainer = compose( [
	withInstanceId,
] )( RichText );

RichTextContainer.Content = ( { value, format, tagName: Tag, ...props } ) => {
	let content;
	switch ( format ) {
		case 'string':
			content = <RawHTML>{ value }</RawHTML>;
			break;

		case 'children':
			content = <RawHTML>{ children.toHTML( value ) }</RawHTML>;
			break;
	}

	if ( Tag ) {
		return <Tag { ...props }>{ content }</Tag>;
	}

	return content;
};

RichTextContainer.Content.defaultProps = {
	format: 'children',
};

export default RichTextContainer;
