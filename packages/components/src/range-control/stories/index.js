/**
 * External dependencies
 */
import { number, text } from '@storybook/addon-knobs';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import RangeControl from '../';

export default { title: 'Components|RangeControl', component: RangeControl };

const RangeControlWithState = ( props ) => {
	const [ value, setValue ] = useState( 5 );

	return (
		<RangeControl
			{ ...props }
			value={ value }
			onChange={ setValue }
		/>
	);
};

export const _default = () => {
	const label = text( 'Label', 'How many columns should this use?' );

	return (
		<RangeControlWithState
			label={ label }
		/>
	);
};

export const withHelp = () => {
	const label = text( 'Label', 'How many columns should this use?' );
	const help = text( 'Help Text', 'Please select the number of columns you would like this to contain.' );

	return (
		<RangeControlWithState
			label={ label }
			help={ help }
		/>
	);
};

export const withMinimumAndMaximumLimits = () => {
	const label = text( 'Label', 'How many columns should this use?' );
	const min = number( 'Min Value', 2 );
	const max = number( 'Max Value', 10 );

	return (
		<RangeControlWithState
			label={ label }
			min={ min }
			max={ max }
		/>
	);
};

export const withIconBefore = () => {
	const label = text( 'Label', 'How many columns should this use?' );
	const icon = text( 'Icon', 'wordpress' );

	return (
		<RangeControlWithState
			label={ label }
			beforeIcon={ icon }
		/>
	);
};

export const withIconAfter = () => {
	const label = text( 'Label', 'How many columns should this use?' );
	const icon = text( 'Icon', 'wordpress' );

	return (
		<RangeControlWithState
			label={ label }
			afterIcon={ icon }
		/>
	);
};

export const withReset = () => {
	const label = text( 'Label', 'How many columns should this use?' );

	return (
		<RangeControlWithState
			label={ label }
			allowReset
		/>
	);
};
