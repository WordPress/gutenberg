/**
* External dependencies
*/
import { TouchableOpacity, Text, View } from 'react-native';

/**
 * WordPress dependencies
 */
import { Dashicon } from '@wordpress/components';

/**
 * Internal dependencies
 */
import styles from './styles.scss';
import Cell from './cell';
import Picker from '../picker';

export default function PickerCell( props ) {
	const {
		options,
		onChangeValue,
		...cellProps
	} = props;

	const defaultLabelStyle = styles.cellLabel;
	let picker;

	const onCellPress = () => {
		picker.presentPicker();
	};

	const onChange = ( newValue ) => {
		onChangeValue( newValue );
	};

	return (
		<Cell onPress={ onCellPress } editable={ false } { ...cellProps } >
			<Picker
				ref={ ( instance ) => picker = instance }
				options={ options }
				onChange={ onChange }
			/>
		</Cell>
	);
}
