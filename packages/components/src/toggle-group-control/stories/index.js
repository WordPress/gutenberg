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
		`${ KNOBS_GROUPS.ToggleGroupControl }: label`,
		'Toggle Group Control',
		KNOBS_GROUPS.ToggleGroupControl
	);
	const hideLabelFromVision = boolean(
		`${ KNOBS_GROUPS.ToggleGroupControl }: hideLabelFromVision`,
		false,
		KNOBS_GROUPS.ToggleGroupControl
	);
	const isBlock = boolean(
		`${ KNOBS_GROUPS.ToggleGroupControl }: isBlock (render as a css block element)`,
		false,
		KNOBS_GROUPS.ToggleGroupControl
	);
	const help = text(
		`${ KNOBS_GROUPS.ToggleGroupControl }: help`,
		undefined,
		KNOBS_GROUPS.ToggleGroupControl
	);
	const isAdaptiveWidth = boolean(
		`${ KNOBS_GROUPS.ToggleGroupControl }: isAdaptiveWidth`,
		false,
		KNOBS_GROUPS.ToggleGroupControl
	);

	const alignOptions = aligns.map( ( key, index ) => (
		<ToggleGroupControlOption
			key={ key }
			value={ key }
			label={ text(
				`${ KNOBS_GROUPS.ToggleGroupControlOption }: label`,
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
