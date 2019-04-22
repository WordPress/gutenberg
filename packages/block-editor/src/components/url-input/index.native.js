/**
 * External dependencies
 */
import { TextInput } from 'react-native';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component } from '@wordpress/element';
import { withInstanceId } from '@wordpress/compose';

class URLInput extends Component {
	render() {
		const { value = '', autoFocus = true, ...extraProps } = this.props;
		/* eslint-disable jsx-a11y/no-autofocus */
		return (
			<TextInput
				autoFocus={ autoFocus }
				editable
				selectTextOnFocus
				autoCapitalize="none"
				autoCorrect={ false }
				textContentType="URL"
				value={ value }
				onChangeText={ this.props.onChange }
				placeholder={ __( 'Paste URL' ) }
				{ ...extraProps }
			/>
		);
		/* eslint-enable jsx-a11y/no-autofocus */
	}
}

export default withInstanceId( URLInput );
