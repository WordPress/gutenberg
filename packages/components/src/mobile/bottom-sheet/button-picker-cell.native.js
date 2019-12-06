/**
 * Internal dependencies
 */
import Cell from './cell';
import styles from './styles.scss';

export default function BottomSheetButtonPickerCell( props ) {
	const {
		onChangeValue,
		...cellProps
	} = props;

	const onChange = () => {
		onChangeValue();
	};

	return (
		<Cell
			onPress={ () => onChange() }
			valueStyle={ styles.sizeButtonsCell }
			editable={ false } { ...cellProps } />
	);
}
