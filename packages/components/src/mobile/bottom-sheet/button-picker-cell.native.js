/**
 * Internal dependencies
 */
import Cell from './cell';
import styles from './styles.scss';

export default function BottomSheetButtonPickerCell( props ) {
	const {
		onChangeValue,
		value,
		options,
		...cellProps
	} = props;

	const getCurrentIndex = () => {
		for ( let i = 0; i < options.length; i++ ) {
			if ( value === options[ i ].slug ) {
				return i;
			}
		}
	};

	return (
		<Cell
			onPress={ () => onChangeValue( options[ ( getCurrentIndex() + 1 ) % options.length ].slug ) }
			valueStyle={ styles.sizeButtonsCell }
			editable={ false } { ...cellProps }
			value={ options[ getCurrentIndex() ].label } />
	);
}
