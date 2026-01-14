/**
 * External dependencies
 */
import type { Meta } from '@storybook/react-webpack5';

/**
 * Internal dependencies
 */
import DataViews from '../index';
import LayoutActivityComponent from './layout-activity';
import LayoutTableComponent from './layout-table';
import LayoutGridComponent from './layout-grid';
import LayoutListComponent from './layout-list';
import LayoutCustomComponent from './layout-custom';
import InfiniteScrollComponent from './infinite-scroll';
import WithCardComponent from './with-card';
import FreeCompositionComponent from './free-composition';
import MinimalUIComponent from './minimal-ui';
import EmptyComponent from './empty';

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

export const LayoutTable = {
	render: LayoutTableComponent,
	args: {
		groupBy: false,
		groupByLabel: true,
		hasClickableItems: true,
		perPageSizes: [ 10, 25, 50, 100 ],
		showMedia: true,
	},
	argTypes: {
		backgroundColor: {
			control: 'color',
			description: 'Background color of the DataViews component',
		},
		groupBy: {
			control: 'boolean',
			description: 'Whether items are grouped by field',
		},
		groupByLabel: {
			control: 'boolean',
			description:
				'Whether to show the groupBy field label in headers (e.g., "Date: Dec 15" vs just "Dec 15")',
		},
		hasClickableItems: {
			control: 'boolean',
			description: 'Are the items clickable',
		},
		perPageSizes: {
			control: 'object',
			description: 'Array of available page sizes',
		},
		showMedia: {
			control: 'boolean',
			description: 'Whether to display the media field',
		},
	},
};

export const LayoutGrid = {
	render: LayoutGridComponent,
	args: {
		groupBy: false,
		groupByLabel: true,
		hasClickableItems: true,
		perPageSizes: [ 10, 25, 50, 100 ],
		showMedia: true,
	},
	argTypes: {
		backgroundColor: {
			control: 'color',
			description: 'Background color of the DataViews component',
		},
		groupBy: {
			control: 'boolean',
			description: 'Whether items are grouped by field',
		},
		groupByLabel: {
			control: 'boolean',
			description:
				'Whether to show the groupBy field label in headers (e.g., "Date: Dec 15" vs just "Dec 15")',
		},
		hasClickableItems: {
			control: 'boolean',
			description: 'Are the items clickable',
		},
		perPageSizes: {
			control: 'object',
			description: 'Array of available page sizes',
		},
		showMedia: {
			control: 'boolean',
			description: 'Whether to display the media field',
		},
	},
};

export const LayoutList = {
	render: LayoutListComponent,
	args: {
		groupBy: false,
		groupByLabel: true,
		hasClickableItems: true,
		perPageSizes: [ 10, 25, 50, 100 ],
		showMedia: true,
	},
	argTypes: {
		backgroundColor: {
			control: 'color',
			description: 'Background color of the DataViews component',
		},
		groupBy: {
			control: 'boolean',
			description: 'Whether items are grouped by field',
		},
		groupByLabel: {
			control: 'boolean',
			description:
				'Whether to show the groupBy field label in headers (e.g., "Date: Dec 15" vs just "Dec 15")',
		},
		hasClickableItems: {
			control: 'boolean',
			description: 'Are the items clickable',
		},
		perPageSizes: {
			control: 'object',
			description: 'Array of available page sizes',
		},
		showMedia: {
			control: 'boolean',
			description: 'Whether to display the media field',
		},
	},
};

export const LayoutActivity = {
	render: LayoutActivityComponent,
	args: {
		groupBy: false,
		groupByLabel: true,
		hasClickableItems: true,
		perPageSizes: [ 10, 25, 50, 100 ],
		showMedia: true,
	},
	argTypes: {
		backgroundColor: {
			control: 'color',
			description: 'Background color of the DataViews component',
		},
		groupBy: {
			control: 'boolean',
			description: 'Whether items are grouped by field',
		},
		groupByLabel: {
			control: 'boolean',
			description:
				'Whether to show the groupBy field label in headers (e.g., "Date: Dec 15" vs just "Dec 15")',
		},
		hasClickableItems: {
			control: 'boolean',
			description: 'Are the items clickable',
		},
		perPageSizes: {
			control: 'object',
			description: 'Array of available page sizes',
		},
		showMedia: {
			control: 'boolean',
			description: 'Whether to display the media field',
		},
	},
};

export const LayoutCustom = {
	render: LayoutCustomComponent,
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

export const InfiniteScroll = {
	render: InfiniteScrollComponent,
};
