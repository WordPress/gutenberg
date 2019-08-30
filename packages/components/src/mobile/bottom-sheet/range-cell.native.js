/**
 * Internal dependencies
 */
import Cell from './cell';
import Slider from '../slider';

export default function BottomSheetRangeCell( props ) {
	const {
		value,
		onChangeValue,
		minimumValue = 0,
		maximumValue = 10,
		disabled,
		step = 1,
		minimumTrackTintColor = '#909090',
		maximumTrackTintColor = '#909090',
		thumbTintColor = '#000',
		...cellProps
	} = props;

	return (
		<Cell
			editable={ false }
			{ ...cellProps }
		>
			<Slider
				value={ value }
				disabled={ disabled }
				step={ step }
				minimumValue={ minimumValue }
				maximumValue={ maximumValue }
				minimumTrackTintColor={ minimumTrackTintColor }
				maximumTrackTintColor={ maximumTrackTintColor }
				thumbTintColor={ thumbTintColor }
				onChangeValue={ onChangeValue }
			/>
		</Cell>
	);
}
