import { TextInput } from 'react-native';
/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';

export class RichText extends Component {
	render() {
		const { value, placeholder, onChange } = this.props;
		const content = value;
		return (
			<TextInput
				multiline={ true }
				value={ content[ 0 ] }
				onChangeText={ ( nextContent ) => {
					onChange( [ nextContent ] );
				}
				}
				placeholder={ placeholder }
			/>
		);
	}
}

export default RichText;
