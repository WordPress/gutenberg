/**
 * External dependencies
 */
import { Picker } from 'react-native';

/**
 * Internal dependencies
 */
import BaseControl from '../base-control';

function TextareaControl( { label, options, value, onChange, rows = 4 } ) {

	const onValueChange = ( { itemValue } ) => {
		onChange( itemValue )
	}

	return (
		<BaseControl label={ label } help={ help } >
			<Picker
				mode='dialog'
				selectedValue={ value }
				onValueChange={ onValueChange }
			>
				{ options.map( ( option, index ) =>
					<Picker.Item 
						key={ `${ option.label }-${ option.value }-${ index }` } 
						label={ option.label } 
						value={ option.value } 
					/>
				) }
			</Picker>
		</BaseControl>
	);
}

export default TextareaControl;
