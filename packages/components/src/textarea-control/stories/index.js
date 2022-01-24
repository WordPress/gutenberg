/**
 * External dependencies
 */
import { boolean, number, text } from '@storybook/addon-knobs';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import TextareaControl from '../';

export default {
	title: 'Components/TextareaControl',
	component: TextareaControl,
	parameters: {
		knobs: { disable: false },
	},
};

const TextareaControlWithState = ( props ) => {
	const [ value, setValue ] = useState();

	return (
		<TextareaControl { ...props } value={ value } onChange={ setValue } />
	);
};

export const _default = () => {
	const label = text( 'Label', 'Label Text' );
	const hideLabelFromVision = boolean( 'Hide Label From Vision', false );
	const help = text( 'Help Text', 'Help text to explain the textarea.' );
	const rows = number( 'Rows', 4 );
	const className = text( 'Class Name', '' );

	return (
		<TextareaControlWithState
			label={ label }
			hideLabelFromVision={ hideLabelFromVision }
			help={ help }
			rows={ rows }
			className={ className }
		/>
	);
};
