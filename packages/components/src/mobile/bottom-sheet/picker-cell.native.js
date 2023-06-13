/**
 * Internal dependencies
 */
import Cell from './cell';
import Picker from '../picker';

export default function BottomSheetPickerCell( props ) {
	const { options, hideCancelButton, onChangeValue, value, ...cellProps } =
		props;

	let picker;

	const onCellPress = () => {
		picker.presentPicker();
	};

	const onChange = ( newValue ) => {
		onChangeValue( newValue );
	};

	const option = options.find( ( opt ) => opt.value === value );
	const label = option ? option.label : value;

	return (
		<Cell
			onPress={ onCellPress }
			editable={ false }
			value={ label }
			{ ...cellProps }
		>
			<Picker
				leftAlign
				hideCancelButton={ hideCancelButton }
				ref={ ( instance ) => ( picker = instance ) }
				options={ options }
				onChange={ onChange }
			/>
		</Cell>
	);
}
