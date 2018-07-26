/**
 * External dependencies
 */
import { Component, renderToString } from '@wordpress/element';
import RCTAztecView from 'react-native-aztec';
import { parse } from '@wordpress/blocks';

/**
 * Internal dependencies
 import styles from './style.scss';
*/

export default class RichText extends Component {
	constructor() {
		super( ...arguments );
		//console.log('RichText');
		//console.log(...arguments)
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
		//console.log('onChange');
		//console.log(event.nativeEvent);
		this.lastEventCount = event.nativeEvent.eventCount;
		this.lastContent = event.nativeEvent.text;

		this.currentTimer = setTimeout( function() {
			// Create a React Tree from the new HTML
			const newParaBlock = parse( '<!-- wp:paragraph --><p>' + this.lastContent + '</p><!-- /wp:paragraph -->' )[ 0 ];
			this.props.onChange( {
				content: newParaBlock.attributes.content,
				eventCount: this.lastEventCount,
			} );
		}.bind( this ), 1000 );
	}

	/**
	 * Handles any case where the content of the AztecRN instance has changed in size
	 */

	onContentSizeChange( event ) {
		//console.log('onContentSizeChange');
		//console.log(event.nativeEvent);
		this.lastContentSizeHeight = event.nativeEvent.contentSize.height;
		this.forceUpdate = true; // Set this to true and check it in shouldComponentUpdate to force re-render the component
		this.props.onContentSizeChange( {
			aztecHeight: this.lastContentSizeHeight,
		}
		);
	}

	shouldComponentUpdate( nextProps ) {
		if ( !! this.forceUpdate ) {
			this.forceUpdate = false;
			return true;
		}

		// The check below allows us to avoid updating the content right after an `onChange` call
		if ( !! nextProps.content.contentTree &&
			!! nextProps.content.eventCount &&
			!! this.lastContent && // first time the component is drawn with empty content `lastContent` is undefined
			!! this.lastEventCount &&
			nextProps.content.eventCount !== this.lastEventCount ) {
			return false;
		}

		return true;
	}

	setForceUpdate( flag ) {
		this.forceUpdate = !! flag;
	}

	render() {
		//console.log('render');
		//console.log(this.props);

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
