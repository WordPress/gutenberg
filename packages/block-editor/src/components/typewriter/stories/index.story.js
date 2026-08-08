/**
 * Internal dependencies
 */
import TypewriterOrIEBypass from '../';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

const meta = {
	title: 'BlockEditor/Typewriter',
	component: TypewriterOrIEBypass,
	parameters: {
		docs: {
			description: {
				component:
					'The `Typewriter` component ensures that the text selection keeps the same vertical distance from the viewport during keyboard events within this component. It provides a typewriter-like behavior for its children.',
			},
			canvas: { sourceState: 'shown' },
		},
	},
	argTypes: {
		children: {
			control: 'text',
			description: 'The children of the component.',
			table: {
				type: { summary: 'string' },
			},
		},
	},
};

export default meta;

export const Default = {
	args: {
		children: __( 'Typewriter Text' ),
	},
	render( { children } ) {
		return <TypewriterOrIEBypass>{ children }</TypewriterOrIEBypass>;
	},
};
