/**
 * External dependencies
 */
import { View, TextInput } from 'react-native';

/**
 * Internal dependencies
 */
import BaseControl from '../base-control';

function TextareaControl( { label, value, help, onChange, rows = 4, ...props } ) {
	return (
		<BaseControl  label={ label } help={ help } >
			<TextInput 
				value={ value } 
				onChangeText={ onChange }
				numberOfLines={ rows }
				multiline={ rows > 1 }
			/>
		</BaseControl>
	);
}

export default TextareaControl;
