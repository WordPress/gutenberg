/**
 * Internal dependencies
 */
import ObserveTyping from '..';

export default {
	title: 'Components/ObserveTyping',
	component: ObserveTyping,
	parameters: {
		docs: {
			canvas: { sourceState: 'shown' },
			description: {
				component:
					"The `ObserveTyping` is a component used in managing the editor's internal typing flag. When used to wrap content, it observes keyboard and mouse events to set and unset the typing flag.",
			},
		},
	},
	argTypes: {
		children: {
			control: {
				type: null,
			},
			description: 'The children elements.',
			table: {
				type: {
					summary: 'ReactNode',
				},
			},
		},
	},
};

export const Default = {
	render: function Template( { ...args } ) {
		return (
			<ObserveTyping { ...args }>
				<input></input>
			</ObserveTyping>
		);
	},
};
