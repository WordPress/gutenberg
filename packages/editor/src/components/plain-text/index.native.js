/**
 * External dependencies
 */
import { TextInput } from 'react-native';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
import styles from './style.scss';

export default class PlainText extends Component {
	componentDidMount() {
		// if isSelected is true, we should request the focus on this TextInput
		if ( ( this._input.isFocused() === false ) && ( this._input.props.isSelected === true ) ) {
			this.focus();
		}
	}

	focus() {
		this._input.focus();
	}

	render() {
		return (
			<TextInput
				ref={ ( x ) => this._input = x }
				className={ [ styles[ 'editor-plain-text' ], this.props.className ] }
				onChangeText={ ( text ) => this.props.onChange( text ) }
				onFocus={ this.props.onFocus } // always assign onFocus as a props
				onBlur={ this.props.onBlur } // always assign onBlur as a props
				{ ...this.props }
			/>
		);
	}
}
