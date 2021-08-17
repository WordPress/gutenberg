/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { __experimentalSpacer as Spacer } from '../../';
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
	const label = 'Toggle Group Control';

	return (
		<View>
			<Spacer>
				<ToggleGroupControl
					isBlock
					onChange={ setAlignState }
					value={ alignState }
					label={ label }
				>
					{ alignOptions }
				</ToggleGroupControl>
			</Spacer>
			<Spacer>
				<ToggleGroupControl label={ label } value="horizontal">
					<ToggleGroupControlOption
						value="horizontal"
						label="Horizontal"
					/>
					<ToggleGroupControlOption
						value="vertical"
						label="Vertical"
					/>
				</ToggleGroupControl>
			</Spacer>
			<Spacer>
				<ToggleGroupControl
					isAdaptiveWidth
					label={ label }
					value="long"
					hideLabelFromVision={ true }
				>
					<ToggleGroupControlOption value="short" label="Short" />
					<ToggleGroupControlOption
						value="long"
						label="Looooooooooooong"
					/>
				</ToggleGroupControl>
			</Spacer>
		</View>
	);
};
