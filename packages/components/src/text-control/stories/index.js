/**
 * External dependencies
 */
import { text, boolean } from '@storybook/addon-knobs';

/**
 * Internal dependencies
 */
import TextControl from '..';

export default {
	title: 'Components|TextControl',
	component: TextControl,
};

export const _default = () => {
	return (
		<TextControl
			type={ text( 'type', 'text' ) }
			label={ text( 'label', 'Name' ) }
			help={ text(
				'help',
				'Tell us what you would like us to call you.'
			) }
			value={ text( 'value' ) }
			hideLabelFromVision={ boolean( 'hideLabelFromVision' ) }
			disabled={ boolean( 'disabled' ) }
			placeholder={ text( 'placeholder', 'Lisa' ) }
			onChange={ () => {} }
		/>
	);
};
