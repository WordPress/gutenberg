/**
 * External dependencies
 */
import { TextInput } from 'react-native';

/**
 * Internal dependencies
 */
import BaseControl from '../base-control';

function TextareaControl( { label, value, help, onChange, rows = 4 } ) {
	return (
		<BaseControl label={ label } help={ help }>
			<TextInput
				style={ { height: 80, borderColor: 'gray', borderWidth: 1 } }
				value={ value }
				onChangeText={ onChange }
				numberOfLines={ rows }
				multiline={ rows > 1 }
				textAlignVertical="top"
			/>
		</BaseControl>
	);
}

export default TextareaControl;
