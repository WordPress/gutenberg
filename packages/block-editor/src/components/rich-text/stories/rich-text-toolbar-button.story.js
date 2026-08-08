/**
 * Internal dependencies
 */
import { RichTextToolbarButton } from '../toolbar-button';

/**
 * WordPress dependencies
 */
import { SlotFillProvider, Slot } from '@wordpress/components';
import { formatBold } from '@wordpress/icons';

const meta = {
	title: 'BlockEditor/RichTextToolbarButton',
	component: RichTextToolbarButton,
	parameters: {
		docs: {
			canvas: {
				sourceState: 'shown',
			},
			description: {
				component:
					'The `RichTextToolbarButton` component is used to render a button in the rich text toolbar.',
			},
		},
	},
	decorators: [
		( Story ) => (
			<SlotFillProvider>
				<div className="components-toolbar">
					<Story />
					<Slot name="RichText.ToolbarControls.bold" />
				</div>
			</SlotFillProvider>
		),
	],
	argTypes: {
		name: {
			control: {
				type: 'text',
			},
			description: 'Name of the button.',
			table: {
				type: {
					summary: 'string',
				},
			},
		},
		icon: {
			control: {
				type: null,
			},
			description: 'Icon of the button.',
			table: {
				type: {
					summary: 'object',
				},
			},
		},
		shortcutType: {
			control: {
				type: 'text',
			},
			description: 'Type of the shortcut.',
			table: {
				type: {
					summary: 'string',
				},
			},
		},
		shortcutCharacter: {
			control: {
				type: 'text',
			},
			description: 'Character of the shortcut.',
			table: {
				type: {
					summary: 'string',
				},
			},
		},
		props: {
			control: {
				type: null,
			},
			description: 'Props of the button.',
			table: {
				type: {
					summary: 'object',
					detail: `Here are examples of the props you can pass:
                
                    - title: The title of the button (e.g., 'Bold').
                    - onClick: Function triggered when the button is clicked.
                    - isActive: A boolean to indicate whether the format is active.
                    `,
				},
			},
		},
	},
};

export default meta;

export const Default = {
	args: {
		name: 'bold',
		icon: formatBold,
		shortcutType: 'primary',
		shortcutCharacter: 'b',
	},
	render: function Template( args ) {
		return <RichTextToolbarButton { ...args } />;
	},
};
