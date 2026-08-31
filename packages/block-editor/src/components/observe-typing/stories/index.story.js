/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import ObserveTyping from '../index.js';

const meta = {
	title: 'BlockEditor/ObserveTyping',
	component: ObserveTyping,
	parameters: {
		docs: {
			canvas: { sourceState: 'shown' },
			description: {
				component:
					'A component that observes typing events and manages the typing flag in the editor.',
			},
		},
	},
	argTypes: {
		children: {
			control: 'element',
			description: 'Content wrapped by the ObserveTyping component.',
			table: {
				type: { summary: 'ReactNode' },
			},
		},
	},
};

export default meta;

function MyInput() {
	const [ isTyping, setIsTyping ] = useState( false );

	const onTypingStart = () => setIsTyping( true );
	const onTypingStop = () => setIsTyping( false );

	return (
		<div>
			<p>{ isTyping ? 'Typing...' : 'Not typing' }</p>
			<input
				type="text"
				onFocus={ onTypingStart }
				onBlur={ onTypingStop }
			/>
		</div>
	);
}

export const Default = {
	render: function Template( { children, ...args } ) {
		return <ObserveTyping { ...args }>{ children }</ObserveTyping>;
	},
	args: {
		children: <MyInput />,
	},
};
