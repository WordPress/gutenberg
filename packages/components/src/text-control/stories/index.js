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
import TextControl from '../';

export default {
	title: 'Components/TextControl',
	component: TextControl,
	parameters: {
		knobs: { disable: false },
	},
};

const TextControlWithState = ( props ) => {
	const [ value, setValue ] = useState();

	return <TextControl { ...props } value={ value } onChange={ setValue } />;
};

export const _default = () => {
	const label = text( 'Label', 'Label Text' );
	const hideLabelFromVision = boolean( 'Hide Label From Vision', false );
	const help = text( 'Help Text', 'Help text to explain the input.' );
	const type = text( 'Input Type', 'text' );
	const className = text( 'Class Name', '' );

	return (
		<TextControlWithState
			label={ label }
			hideLabelFromVision={ hideLabelFromVision }
			help={ help }
			type={ type }
			className={ className }
		/>
	);
};
