/**
 * Internal dependencies
 */
import Cell from './cell';
import BottomSheetButton from './button';

export default function BottomSheetButtonPickerCell( props ) {
	const {
		onChangeValue,
		...cellProps
	} = props;

	const onChange = ( newValue ) => {
		onChangeValue( newValue );
	};

	return (
		<Cell editable={ false } { ...cellProps } >
			<BottomSheetButton
				text={ 'T' }
				onPress={ () => onChange( 'thumbnail' ) }
			/>
			<BottomSheetButton
				text={ 'M' }
				onPress={ () => onChange( 'medium' ) }
			/>
			<BottomSheetButton
				text={ 'L' }
				onPress={ () => onChange( 'large' ) }
			/>
			<BottomSheetButton
				text={ 'F' }
				onPress={ () => onChange( 'full' ) }
			/>
		</Cell>
	);
}
