/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import KeyboardShortcuts from '..';

const meta = {
	title: 'Components/Utilities/KeyboardShortcuts',
	component: KeyboardShortcuts,
	id: 'components-keyboardshortcuts',
	parameters: {
		docs: {
			canvas: { sourceState: 'shown' },
			description: {
				component:
					'The `KeyboardShortcuts` component allows you to define keyboard shortcuts and handle them in your application.',
			},
		},
	},
	argTypes: {
		children: {
			control: { type: null },
			description:
				'Elements to render, upon whom key events are to be monitored.',
			table: {
				type: { summary: 'React.ReactNode' },
			},
		},
		shortcuts: {
			control: { type: 'object' },
			description:
				'An object of shortcut bindings, where each key is a keyboard combination, the value of which is the callback to be invoked when the key combination is pressed.\n\n The value of each shortcut should be a consistent function reference, not an anonymous function. Otherwise, the callback will not be correctly unbound when the component unmounts.\n\n The `KeyboardShortcuts` component will not update to reflect a changed `shortcuts` prop.If you need to change shortcuts, mount a separate `KeyboardShortcuts` element, which can be achieved by assigning a unique `key` prop.',
			table: {
				type: {
					summary: 'Record<string, (event: KeyboardEvent) => void>',
				},
			},
		},
		bindGlobal: {
			control: { type: 'boolean' },
			description:
				'By default, a callback will not be invoked if the key combination occurs in an editable field. Pass `bindGlobal` as `true` if the key events should be observed globally, including within editable fields.\n\nTip: If you need some but not all keyboard events to be observed globally, simply render two distinct `KeyboardShortcuts` elements, one with and one without the `bindGlobal` prop.',
			table: {
				type: { summary: 'boolean' },
			},
		},
		eventName: {
			control: { type: 'text' },
			description:
				'By default, a callback is invoked in response to the `keydown` event. To override this, pass `eventName` with the name of a specific keyboard event.',
			table: {
				type: { summary: 'string' },
			},
		},
	},
};

export default meta;

export const Default = {
	render: function Template( { shortcuts, ...args } ) {
		const [ pressedKey, setPressedKey ] = useState( null );

		const enhancedShortcuts = {
			...shortcuts,
			c: () => setPressedKey( 'You pressed "c"!' ),
			d: () => setPressedKey( 'You pressed "d"!' ),
		};

		return (
			<KeyboardShortcuts shortcuts={ enhancedShortcuts } { ...args }>
				<div style={ { padding: '20px', border: '1px solid #ddd' } }>
					<p>Hit the a, b, c, or d key inside this text area:</p>
					<textarea />
					{ pressedKey && (
						<p
							style={ {
								marginTop: '10px',
								padding: '10px',
								background: '#f9f9f9',
								border: '1px solid #ddd',
							} }
						>
							{ pressedKey }
						</p>
					) }
				</div>
			</KeyboardShortcuts>
		);
	},
	args: {
		shortcuts: {
			// eslint-disable-next-line no-alert
			a: () => window.alert( 'You hit "a"!' ),
			// eslint-disable-next-line no-alert
			b: () => window.alert( 'You hit "b"!' ),
		},
		children: null,
	},
	parameters: {
		docs: {
			source: {
				code: `
					<KeyboardShortcuts
					shortcuts={{
						a: () => window.alert('You hit "a"!'),
						b: () => window.alert('You hit "b"!'),
						c: () => setPressedKey('You pressed "c"!'),
						d: () => setPressedKey('You pressed "d"!'),
					}}
					>
					<div>
						<p>Hit the "a", "b", "c", or "d" key in this textarea:</p>
						<textarea />
						{pressedKey && <p>{pressedKey}</p>}
					</div>
					</KeyboardShortcuts>
				`,
			},
		},
	},
};
