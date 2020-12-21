/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * External dependencies
 */
import { noop } from '@wp-g2/utils';

/**
 * Internal dependencies
 */
import {
	ControlLabel,
	Grid,
	Slider,
	TextInput,
	VStack,
} from '@wp-g2/components';
import { getSliderTemplateColumns } from './font-size-control-utils';

function FontSizeControlSlider( props ) {
	const {
		label = __( 'Custom size' ),
		disabled,
		min,
		max,
		onChange = noop,
		size,
		value,
		withSlider,
	} = props;

	if ( ! withSlider ) return null;

	const templateColumns = getSliderTemplateColumns();

	const controlProps = {
		disabled,
		min,
		max,
		onChange,
		size,
		value,
	};

	return (
		<VStack spacing={ 0 }>
			<ControlLabel>{ label }</ControlLabel>
			<Grid templateColumns={ templateColumns }>
				<Slider { ...controlProps } />
				<TextInput { ...controlProps } type="number" />
			</Grid>
		</VStack>
	);
}

export default FontSizeControlSlider;
