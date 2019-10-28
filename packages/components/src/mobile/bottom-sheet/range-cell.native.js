/**
 * External dependencies
 */
import { Platform } from 'react-native';

/**
 * Internal dependencies
 */
import Cell from './cell';
import Slider from '../slider';

export default function BottomSheetRangeCell( props ) {
	const {
		value,
		defaultValue,
		onChangeValue,
		minimumValue = 0,
		maximumValue = 10,
		disabled,
		step = 1,
		minimumTrackTintColor = '#00669b',
		maximumTrackTintColor = Platform.OS === 'ios' ? '#e9eff3' : '#909090',
		thumbTintColor = Platform.OS === 'ios' ? '#fff' : '#00669b',
		...cellProps
	} = props;

	return (
		<Cell
			editable={ false }
			{ ...cellProps }
		>
			<Slider
				value={ value }
				defaultValue={ defaultValue }
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
