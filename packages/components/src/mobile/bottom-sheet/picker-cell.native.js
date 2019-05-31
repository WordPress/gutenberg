/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Cell from './cell';
import Picker from '../picker';

const BottomSheetPickerCell = ( {
	options,
	onChangeValue,
	...cellProps
} ) => {
	const [ isPickerOpen, showPicker ] = useState( false );
	const openPicker = () => showPicker( true );
	const closePicker = () => showPicker( false );
	const onChange = ( value ) => {
		onChangeValue( value );
		closePicker();
	};

	return (
		<Cell onPress={ openPicker } editable={ false } { ...cellProps }>
			<Picker
				isOpen={ isPickerOpen }
				options={ options }
				onChange={ onChange }
				onClose={ closePicker }
			/>
		</Cell>
	);
};

export default BottomSheetPickerCell;
