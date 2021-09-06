/**
 * External dependencies
 */
import { boolean, text } from '@storybook/addon-knobs';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { ToggleGroupControl, ToggleGroupControlOption } from '../index';
import { View } from '../../view';

export default {
	component: ToggleGroupControl,
	title: 'Components/ToggleGroupControl',
};

const aligns = [ 'Left', 'Center', 'Right', 'Justify' ];
const KNOBS_GROUPS = {
	ToggleGroupControl: 'ToggleGroupControl',
	ToggleGroupControlOption: 'ToggleGroupControlOption',
};

export const _default = () => {
	const [ alignState, setAlignState ] = useState( aligns[ 0 ] );
	const label = text(
		'Label',
		'Toggle Group Control',
		KNOBS_GROUPS.ToggleGroupControl
	);
	const hideLabelFromVision = boolean(
		'Hide label from vision',
		false,
		KNOBS_GROUPS.ToggleGroupControl
	);
	const isBlock = boolean(
		'Render `ToggleGroupControl` as a (CSS) block element',
		false,
		KNOBS_GROUPS.ToggleGroupControl
	);
	const help = text(
		'Help Text',
		undefined,
		KNOBS_GROUPS.ToggleGroupControl
	);
	const isAdaptiveWidth = boolean(
		'Render segments with equal widths',
		false,
		KNOBS_GROUPS.ToggleGroupControl
	);

	const alignOptions = aligns.map( ( key, index ) => (
		<ToggleGroupControlOption
			key={ key }
			value={ key }
			label={ text(
				'Label',
				key,
				`${ KNOBS_GROUPS.ToggleGroupControlOption }-${ index + 1 }`
			) }
		/>
	) );

	return (
		<View>
			<ToggleGroupControl
				onChange={ setAlignState }
				value={ alignState }
				label={ label }
				hideLabelFromVision={ hideLabelFromVision }
				help={ help }
				isBlock={ isBlock }
				isAdaptiveWidth={ isAdaptiveWidth }
			>
				{ alignOptions }
			</ToggleGroupControl>
		</View>
	);
};
