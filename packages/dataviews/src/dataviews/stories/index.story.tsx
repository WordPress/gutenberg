/**
 * External dependencies
 */
import type { Meta } from '@storybook/react';

/**
 * Internal dependencies
 */
import DataViews from '../index';
import LayoutActivityComponent from './layout-activity';
import InfiniteScrollComponent from './infinite-scroll';
import GroupByComponent from './group-by';
import WithCardComponent from './with-card';
import FreeCompositionComponent from './free-composition';
import MinimalUIComponent from './minimal-ui';
import EmptyComponent from './empty';
import DefaultComponent from './all';

import './style.css';

const meta = {
	title: 'DataViews/DataViews',
	component: DataViews,
	// Use fullscreen layout and a wrapper div with padding to resolve conflicts
	// between Ariakit's Dialog (usePreventBodyScroll) and Storybook's body padding
	// (sb-main-padding class). This ensures consistent layout in DataViews stories
	// when clicking actions menus. Without this the padding on the body will jump.
	parameters: {
		layout: 'fullscreen',
	},
	decorators: [
		( Story ) => (
			<div style={ { padding: '1rem' } }>
				<Story />
			</div>
		),
	],
} as Meta< typeof DataViews >;
export default meta;

export const Default = {
	render: DefaultComponent,
	args: {
		perPageSizes: [ 10, 25, 50, 100 ],
		hasClickableItems: true,
	},
	argTypes: {
		perPageSizes: {
			control: 'object',
			description: 'Array of available page sizes',
		},
		hasClickableItems: {
			control: 'boolean',
			description: 'Are the items clickable',
		},
		backgroundColor: {
			control: 'color',
			description: 'Background color of the DataViews component',
		},
	},
};

export const Empty = {
	render: EmptyComponent,
	args: {
		customEmpty: false,
		containerHeight: '50vh',
		isLoading: false,
	},
	argTypes: {
		customEmpty: {
			control: 'boolean',
			description: 'Use custom empty state with planet illustration',
		},
		containerHeight: {
			control: 'select',
			options: [ 'auto', '50vh', '100vh' ],
			description: 'Height of the container',
		},
		isLoading: {
			control: 'boolean',
			description: 'Show loading state',
		},
	},
};

export const MinimalUI = {
	render: MinimalUIComponent,
	argTypes: {
		layout: {
			control: 'select',
			options: [ 'table', 'list', 'grid', 'activity' ],
			defaultValue: 'table',
		},
	},
};

export const FreeComposition = {
	render: FreeCompositionComponent,
};

export const WithCard = {
	render: WithCardComponent,
};

export const GroupByLayout = {
	render: GroupByComponent,
	args: {
		showLabel: true,
	},
	argTypes: {
		showLabel: {
			control: 'boolean',
			description:
				'Whether to show the field label in group headers (e.g., "Type: Planet" vs just "Planet")',
		},
	},
};

export const InfiniteScroll = {
	render: InfiniteScrollComponent,
};

export const LayoutActivity = {
	render: LayoutActivityComponent,
	args: {
		showMedia: true,
		grouping: true,
		showLabel: true,
	},
	argTypes: {
		showMedia: {
			control: 'boolean',
			options: [ true, false ],
			defaultValue: true,
			description: 'Whether the icon is shown in the activity list',
		},
		grouping: {
			control: 'boolean',
			options: [ true, false ],
			defaultValue: true,
			description:
				'Whether items are grouped by date in the activity list',
		},
		showLabel: {
			control: 'boolean',
			description:
				'Whether to show the field label in group headers (e.g., "Date: Dec 15" vs just "Dec 15")',
		},
	},
};
