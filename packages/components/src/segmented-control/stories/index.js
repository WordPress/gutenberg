/**
 * WordPress dependencies
 */
import {
	alignCenter,
	alignJustify,
	alignLeft,
	alignRight,
} from '@wordpress/icons';
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Icon, __experimentalSpacer as Spacer } from '../../';
import { SegmentedControl } from '../index';
import { View } from '../../view';

export default {
	component: SegmentedControl,
	title: 'Components/SegmentedControl',
};

const alignMapObject = {
	left: alignLeft,
	center: alignCenter,
	right: alignRight,
	justify: alignJustify,
};
const align = Object.entries( alignMapObject ).map( ( [ key, icon ] ) => (
	<SegmentedControl.Option
		key={ key }
		value={ key }
		label={
			<Icon
				icon={ icon }
				size={ 14 }
				style={ { fill: 'currentColor' } }
			/>
		}
	/>
) );

export const _default = () => {
	const [ alignState, setAlignState ] = useState(
		Object.keys( alignMapObject )[ 0 ]
	);
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
					{ align }
				</SegmentedControl>
			</Spacer>
			<Spacer>
				<SegmentedControl
					isBlock
					onChange={ setAlignState }
					value={ alignState }
					label={ label }
				>
					{ align }
				</SegmentedControl>
			</Spacer>
			<Spacer>
				<SegmentedControl label={ label } value="horizontal">
					<SegmentedControl.Option
						value="horizontal"
						label="Horizontal"
					/>
					<SegmentedControl.Option
						value="vertical"
						label="Vertical"
					/>
				</SegmentedControl>
			</Spacer>
			<Spacer>
				<SegmentedControl isAdaptiveWidth label={ label } value="long">
					<SegmentedControl.Option value="short" label="Short" />
					<SegmentedControl.Option
						value="long"
						label="Looooooooooooong"
					/>
				</SegmentedControl>
			</Spacer>
		</View>
	);
};
