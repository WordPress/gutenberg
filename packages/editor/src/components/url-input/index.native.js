import { TextInput, View } from 'react-native';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component } from '@wordpress/element';
import { withInstanceId } from '@wordpress/compose';

class URLInput extends Component {
	render() {
		const { value = '', autoFocus = true } = this.props;
		/* eslint-disable jsx-a11y/no-autofocus */
		return (
			<View>
				<TextInput
					autoFocus={ autoFocus }
					editable
					selectTextOnFocus
					textContentType="URL"
					value={ value }
					onChangeText={ this.props.onChange }
					placeholder={ __( 'Paste URL or type to search' ) }
				/>
			</View>
		);
		/* eslint-enable jsx-a11y/no-autofocus */
	}
}

export default withInstanceId( URLInput );
