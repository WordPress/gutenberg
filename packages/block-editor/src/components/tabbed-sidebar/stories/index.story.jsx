/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import TabbedSidebar from '../';

const meta = {
	title: 'BlockEditor/TabbedSidebar',
	component: TabbedSidebar,
	tags: [ 'status-private' ],
	parameters: {
		docs: {
			canvas: { sourceState: 'shown' },
			description: {
				component:
					'A component that creates a tabbed sidebar with a close button.',
			},
		},
	},
	argTypes: {
		defaultTabId: {
			control: { type: null },
			table: {
				type: { summary: 'string' },
			},
			description:
				'The ID of the tab to be selected by default when the component renders.',
		},
		onClose: {
			action: 'onClose',
			control: { type: null },
			table: {
				type: { summary: 'function' },
			},
			description: 'Function called when the close button is clicked.',
		},
		onSelect: {
			action: 'onSelect',
			control: { type: null },
			table: {
				type: { summary: 'function' },
			},
			description:
				"Function called when a tab is selected. Receives the selected tab's ID as an argument.",
		},
		selectedTab: {
			control: { type: null },
			table: {
				type: { summary: 'string' },
			},
			description: 'The ID of the currently selected tab.',
		},
		tabs: {
			control: { type: 'array' },
			table: {
				type: { summary: 'array' },
			},
			description:
				'Array of tab objects. Each tab should have: name (string), title (string), panel (React.Node), and optionally panelRef (React.Ref).',
		},
		closeButtonLabel: {
			control: { type: 'text' },
			table: {
				type: { summary: 'string' },
			},
			description: 'Accessibility label for the close button.',
		},
	},
};

export default meta;

const DEMO_TABS = [
	{ name: 'tab1', title: 'Settings' },
	{ name: 'tab2', title: 'Styles' },
	{ name: 'tab3', title: 'Advanced' },
];

export const Default = {
	render: function Template( { onSelect, onClose, ...args } ) {
		const [ selectedTab, setSelectedTab ] = useState();

		return (
			<TabbedSidebar
				{ ...args }
				selectedTab={ selectedTab }
				onSelect={ ( ...changeArgs ) => {
					onSelect( ...changeArgs );
					setSelectedTab( ...changeArgs );
				} }
				onClose={ onClose }
			/>
		);
	},
	args: {
		tabs: DEMO_TABS,
		defaultTabId: 'tab1',
		closeButtonLabel: 'Close Sidebar',
	},
};
