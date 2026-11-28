/**
 * Internal dependencies
 */
import { keyboardShortcutContext } from '../index.js';
import { RichTextShortcut } from '../shortcut.js';

const meta = {
	title: 'BlockEditor/RichTextShortcut',
	component: RichTextShortcut,
	parameters: {
		docs: {
			canvas: {
				sourceState: 'shown',
			},
			description: {
				component:
					'The `RichTextShortcut` component is used to define a keyboard shortcut for a specific action.',
			},
		},
	},
	argTypes: {
		character: {
			control: {
				type: 'text',
			},
			description: 'The character that triggers the shortcut.',
			table: {
				type: {
					summary: 'string',
				},
			},
		},
		type: {
			control: {
				type: 'select',
				options: [ 'primary', 'access' ],
			},
			description: 'The type of shortcut.',
			table: {
				type: {
					summary: 'string',
				},
			},
		},
		onUse: {
			description: 'Function to be called when the shortcut is used.',
			table: {
				type: {
					summary: 'function',
				},
			},
		},
	},
	decorators: [
		( Story ) => {
			const keyboardShortcuts = {
				current: new Set(),
			};

			return (
				<keyboardShortcutContext.Provider value={ keyboardShortcuts }>
					{ Story() }
				</keyboardShortcutContext.Provider>
			);
		},
	],
};

export default meta;

export const Default = {
	args: {
		character: 'b',
		type: 'primary',
		onUse: () => {},
	},
	render: function Template( args ) {
		return <RichTextShortcut { ...args } />;
	},
};
