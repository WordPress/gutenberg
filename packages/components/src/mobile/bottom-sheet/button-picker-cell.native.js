/**
 * Internal dependencies
 */
import Cell from './cell';
import BottomSheetButton from './button';
import styles from './styles.scss';

export default function BottomSheetButtonPickerCell( props ) {
	const {
		onChangeValue,
		...cellProps
	} = props;

	const onChange = ( newValue ) => {
		onChangeValue( newValue );
	};

	return (
		<Cell valueStyle={ styles.sizeButtonsCell } editable={ false } { ...cellProps } >
			<BottomSheetButton
				text={ 'S' }
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
