/**
 * External dependencies
 */
import { findIndex } from 'lodash';
/**
 * Internal dependencies
 */
import Cell from './cell';

export default function BottomSheetCyclePickerCell( props ) {
	const { value, options, onChangeValue, ...cellProps } = props;

	const nextOptionValue = () => {
		const selectedOptionIndex = findIndex( options, [ 'value', value ] );
		return options[ ( selectedOptionIndex + 1 ) % options.length ].value;
	};

	return (
		<Cell
			onPress={ () => onChangeValue( nextOptionValue() ) }
			editable={ false }
			value={ options[ findIndex( options, [ 'value', value ] ) ].label }
			{ ...cellProps }
		/>
	);
}
