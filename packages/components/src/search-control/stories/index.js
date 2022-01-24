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
import SearchControl from '../';

export default {
	title: 'Components/SearchControl',
	component: SearchControl,
	parameters: {
		knobs: { disable: false },
	},
};

export const _default = () => {
	const [ value, setValue ] = useState();
	const label = text( 'Label', 'Label Text' );
	const hideLabelFromVision = boolean( 'Hide Label From Vision', true );
	const help = text( 'Help Text', 'Help text to explain the input.' );

	return (
		<SearchControl
			label={ label }
			hideLabelFromVision={ hideLabelFromVision }
			help={ help }
			value={ value }
			onChange={ setValue }
		/>
	);
};
