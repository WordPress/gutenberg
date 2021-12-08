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
import Button from '../../button';

export default {
	title: 'Components/TextControl',
	component: TextControl,
	parameters: {
		knobs: { disable: false },
	},
};

const TextControlWithState = ( props ) => {
	const [ value, setValue ] = useState( '' );

	return <TextControl { ...props } value={ value } onChange={ setValue } />;
};

const TextControlWithStateAndChildren = ( props ) => {
	const [ value, setValue ] = useState( '' );

	return (
		<TextControl { ...props } value={ value } onChange={ setValue }>
			<Button
				disabled={ ! value }
				variant="primary"
				onClick={ () => setValue( '' ) }
			>
				Clear input
			</Button>
		</TextControl>
	);
};

const label = text( 'Label', 'Label Text' );
const hideLabelFromVision = boolean( 'Hide Label From Vision', false );
const help = text( 'Help Text', 'Help text to explain the input.' );
const type = text( 'Input Type', 'text' );
const className = text( 'Class Name', '' );

export const _default = () => {
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

export const withChildren = () => {
	return (
		<TextControlWithStateAndChildren
			label={ label }
			hideLabelFromVision={ hideLabelFromVision }
			help={ help }
			type={ type }
			className={ className }
		/>
	);
};
