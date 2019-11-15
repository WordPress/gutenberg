/**
 * External dependencies
 */
import { text } from '@storybook/addon-knobs';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import ToggleControl from '../';

export default { title: 'Components|ToggleControl', component: ToggleControl };

const ToggleControlWithState = ( { helpTextChecked, helpTextUnchecked, ...props } ) => {
	const [ hasFixedBackground, setHasFixedBackground ] = useState( true );
	return (
		<ToggleControl
			{ ...props }
			help={ hasFixedBackground ? helpTextChecked : helpTextUnchecked }
			checked={ hasFixedBackground }
			onChange={ setHasFixedBackground }
		/>
	);
};

export const _default = () => {
	const label = text( 'Label', 'Does this have a fixed background?' );

	return (
		<ToggleControlWithState
			label={ label }
		/>
	);
};

export const withHelpText = () => {
	const label = text( 'Label', 'Does this have a fixed background?' );
	const helpTextChecked = text( 'Help When Checked', 'Has fixed background.' );
	const helpTextUnchecked = text( 'Help When Unchecked', 'No fixed background.' );

	return (
		<ToggleControlWithState
			label={ label }
			helpTextChecked={ helpTextChecked }
			helpTextUnchecked={ helpTextUnchecked }
		/>
	);
};
