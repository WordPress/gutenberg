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
const alignOptions = aligns.map( ( key ) => (
	<ToggleGroupControlOption key={ key } value={ key } label={ key } />
) );

export const _default = () => {
	const [ alignState, setAlignState ] = useState( aligns[ 0 ] );
	const label = text( 'Label', 'Toggle Group Control' );
	const hideLabelFromVision = boolean( 'Hide label from vision', false );
	const isBlock = boolean(
		'Render `ToggleGroupControl` as a (CSS) block element',
		false
	);
	const help = text( 'Help Text' );
	const isAdaptiveWidth = boolean(
		'Render segments with equal widths',
		false
	);
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
