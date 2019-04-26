
import { Switch } from 'react-native';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import Cell from './cell';

export default function SwitchCell( props ) {
	const {
		value,
		onValueChange,
		...cellProps
	} = props;

	const onChange = ( newValue ) => {
		onChangeValue( newValue );
	};

	const onPress = () => {
		onValueChange( ! value );
	}

	return (
		<Cell 
			{ ...cellProps }
			accessibilityRole={ 'none' }
			accessibilityHint={
				/* translators: accessibility text (hint for switches) */
				__( 'Double tap to toggle setting' )
			}
			onPress={ onPress }
			editable={ false }
			value={ '' }
		>
			<Switch
				value={ value }
				onValueChange={ onValueChange }
			/>
		</Cell>
	);
}
