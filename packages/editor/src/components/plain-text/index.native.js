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
		this.isIOS = Platform.OS === 'ios';
	}

	componentDidMount() {
		// if isSelected is true, we should request the focus on this TextInput
		if ( ( this._input.isFocused() === false ) && ( this._input.props.isSelected === true ) ) {
			this.focus();
		}
	}

	componentDidUpdate( prevProps ) {
		if ( ! this.props.isSelected && prevProps.isSelected && this.isIOS ) {
			this._input.blur();
		}
	}

	focus() {
		this._input.focus();
	}

	render() {
		return (
			<TextInput
				{ ...this.props }
				ref={ ( x ) => this._input = x }
				className={ [ styles[ 'editor-plain-text' ], this.props.className ] }
				onChange={ ( event ) => {
					this.props.onChange( event.nativeEvent.text );
				} }
				onFocus={ this.props.onFocus } // always assign onFocus as a props
				onBlur={ this.props.onBlur } // always assign onBlur as a props
			/>
		);
	}
}
