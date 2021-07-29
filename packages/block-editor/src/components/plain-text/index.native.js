/**
 * External dependencies
 */
import { TextInput, Platform } from 'react-native';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
import styles from './style.scss';

export default class PlainText extends Component {
	constructor() {
		super( ...arguments );
		this.isAndroid = Platform.OS === 'android';
	}

	componentDidMount() {
		// if isSelected is true, we should request the focus on this TextInput
		if (
			this._input &&
			this._input.isFocused() === false &&
			this.props.isSelected
		) {
			if ( this.isAndroid ) {
				/*
				 * There seems to be an issue in React Native where the keyboard doesn't show if called shortly after rendering.
				 * As a common work around this delay is used.
				 * https://github.com/facebook/react-native/issues/19366#issuecomment-400603928
				 */
				this.timeoutID = setTimeout( () => {
					this._input.focus();
				}, 100 );
			} else {
				this._input.focus();
			}
		}
	}

	componentDidUpdate( prevProps ) {
		if ( ! this.props.isSelected && prevProps.isSelected ) {
			this._input.blur();
		}
	}

	componentWillUnmount() {
		if ( this.isAndroid ) {
			clearTimeout( this.timeoutID );
		}
	}

	focus() {
		this._input.focus();
	}

	blur() {
		this._input.blur();
	}

	render() {
		return (
			<TextInput
				{ ...this.props }
				ref={ ( x ) => ( this._input = x ) }
				onChange={ ( event ) => {
					this.props.onChange( event.nativeEvent.text );
				} }
				onFocus={ this.props.onFocus } // always assign onFocus as a props
				onBlur={ this.props.onBlur } // always assign onBlur as a props
				fontFamily={
					( this.props.style && this.props.style.fontFamily ) ||
					styles[ 'block-editor-plain-text' ].fontFamily
				}
				style={
					this.props.style || styles[ 'block-editor-plain-text' ]
				}
				scrollEnabled={ false }
			/>
		);
	}
}
