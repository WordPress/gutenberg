/**
 * External dependencies
 */
import { findIndex } from 'lodash';
/**
 * Internal dependencies
 */
import Cell from './cell';

export default function BottomSheetCyclePickerCell( props ) {
	const {
		value,
		options,
		onChangeValue,
		...cellProps
	} = props;

	const cycleOptionValue = () => {
		return options[ ( findIndex( options, [ 'slug', value ] ) + 1 ) % options.length ].slug;
	};

	return (
		<Cell
			onPress={ () => onChangeValue( cycleOptionValue() ) }
			editable={ false }
			value={ options[ findIndex( options, [ 'slug', value ] ) ].label }
			{ ...cellProps }
		/>
	);
}
