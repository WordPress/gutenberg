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
const align = Object.entries( alignMapObject ).map( ( [ key, icon ] ) => ( {
	label: (
		<Icon icon={ icon } size={ 14 } style={ { fill: 'currentColor' } } />
	),
	value: key,
} ) );

export const _default = () => {
	const [ alignState, setAlignState ] = useState( align[ 0 ].value );
	const label = 'Segmented Control';
	const xy = [
		{
			label: 'Horizontal',
			value: 'horizontal',
		},
		{
			label: 'Vertical',
			value: 'vertical',
		},
	];

	const shortLong = [
		{
			label: 'Short',
			value: 'short',
		},
		{
			label: 'Looooooooooooong',
			value: 'long',
		},
	];

	return (
		<View>
			<Spacer>
				<SegmentedControl
					isBlock
					onChange={ setAlignState }
					options={ align }
					value={ alignState }
					label={ label }
				/>
			</Spacer>
			<Spacer>
				<SegmentedControl
					isBlock
					onChange={ setAlignState }
					options={ align }
					value={ alignState }
					label={ label }
				/>
			</Spacer>
			<Spacer>
				<SegmentedControl options={ xy } label={ label } />
			</Spacer>
			<Spacer>
				<SegmentedControl
					isAdaptiveWidth
					options={ shortLong }
					label={ label }
				/>
			</Spacer>
		</View>
	);
};
