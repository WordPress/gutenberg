/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { __experimentalSpacer as Spacer } from '../../';
import { SegmentedControl, SegmentedControlOption } from '../index';
import { View } from '../../view';

export default {
	component: SegmentedControl,
	title: 'Components/SegmentedControl',
};

const aligns = [ 'Left', 'Center', 'Right', 'Justify' ];
const alignOptions = aligns.map( ( key ) => (
	<SegmentedControlOption key={ key } value={ key } label={ key } />
) );

export const _default = () => {
	const [ alignState, setAlignState ] = useState( aligns[ 0 ] );
	const label = 'Segmented Control';

	return (
		<View>
			<Spacer>
				<SegmentedControl
					isBlock
					onChange={ setAlignState }
					value={ alignState }
					label={ label }
				>
					{ alignOptions }
				</SegmentedControl>
			</Spacer>
			<Spacer>
				<SegmentedControl label={ label } value="horizontal">
					<SegmentedControlOption
						value="horizontal"
						label="Horizontal"
					/>
					<SegmentedControlOption value="vertical" label="Vertical" />
				</SegmentedControl>
			</Spacer>
			<Spacer>
				<SegmentedControl isAdaptiveWidth label={ label } value="long">
					<SegmentedControlOption value="short" label="Short" />
					<SegmentedControlOption
						value="long"
						label="Looooooooooooong"
					/>
				</SegmentedControl>
			</Spacer>
		</View>
	);
};
