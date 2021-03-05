/**
 * External dependencies
 */
import { noop } from 'lodash';
import { ControlLabel, Slider, TextInput } from '@wp-g2/components';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { getSliderTemplateColumns } from './utils';
import { Grid } from '../grid';
import { VStack } from '../v-stack';

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
