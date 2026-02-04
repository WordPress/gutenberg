/**
 * Internal dependencies
 */
import DataForm from '../index';
import LayoutCardComponent from './layout-card';
import LayoutDetailsComponent from './layout-details';
import LayoutMixedComponent from './layout-mixed';
import LayoutRegularComponent from './layout-regular';
import LayoutRowComponent from './layout-row';
import LayoutPanelComponent from './layout-panel';
import DataAdapterComponent from './data-adapter';
import ValidationComponent from './validation';
import VisibilityComponent from './visibility';

const meta = {
	title: 'DataViews/DataForm',
	component: DataForm,
};
export default meta;

export const LayoutCard = {
	render: LayoutCardComponent,
	argTypes: {
		withHeader: {
			control: { type: 'boolean' },
			description: 'Whether the card has a header.',
		},
		isCollapsible: {
			control: { type: 'boolean' },
			description: 'Whether the card can be collapsed/expanded.',
		},
		isOpened: {
			control: { type: 'boolean' },
			description: 'Whether the card loads opened.',
		},
		withSummary: {
			control: { type: 'boolean' },
			description: 'Whether the card has a summary.',
		},
	},
	args: {
		withHeader: true,
		withSummary: true,
		isCollapsible: true,
	},
};

export const LayoutDetails = {
	render: LayoutDetailsComponent,
};

export const LayoutPanel = {
	render: LayoutPanelComponent,
	argTypes: {
		labelPosition: {
			control: { type: 'select' },
			description: 'Chooses the label position.',
			options: [ 'default', 'top', 'side', 'none' ],
		},
		openAs: {
			control: { type: 'select' },
			description: 'Chooses how to open the panel.',
			options: [ 'default', 'dropdown', 'modal' ],
		},
	},
};

export const LayoutRegular = {
	render: LayoutRegularComponent,
	argTypes: {
		labelPosition: {
			control: { type: 'select' },
			description: 'Chooses the label position.',
			options: [ 'default', 'top', 'side', 'none' ],
		},
	},
};

export const LayoutRow = {
	render: LayoutRowComponent,
	argTypes: {
		alignment: {
			control: { type: 'select' },
			description: 'The alignment of the fields.',
			options: [ 'default', 'start', 'center', 'end' ],
		},
	},
	args: {
		alignment: 'default',
	},
};

export const LayoutMixed = {
	render: LayoutMixedComponent,
};

export const Validation = {
	render: ValidationComponent,
	argTypes: {
		layout: {
			control: { type: 'select' },
			description: 'Choose the form layout type.',
			options: [
				'regular',
				'panel-dropdown',
				'panel-modal',
				'card-collapsible',
				'card-not-collapsible',
				'details',
			],
		},
		required: {
			control: { type: 'boolean' },
			description:
				'Whether or not the required validation rule is active (only applies when fieldDistribution is allSame).',
		},
		elements: {
			control: { type: 'select' },
			description:
				'Whether or not the elements validation rule is active.',
			options: [ 'sync', 'async', 'none' ],
		},
		custom: {
			control: { type: 'select' },
			description: 'Whether or not the custom validation rule is active.',
			options: [ 'sync', 'async', 'none' ],
		},
		pattern: {
			control: { type: 'boolean' },
			description:
				'Whether or not the pattern validation rule is active.',
		},
		minMax: {
			control: { type: 'boolean' },
			description:
				'Whether or not the min/max validation rule is active.',
		},
	},
	args: {
		layout: 'regular',
		required: true,
		elements: 'sync',
		custom: 'sync',
		pattern: false,
		minMax: false,
	},
};

export const Visibility = {
	render: VisibilityComponent,
};

export const DataAdapter = {
	render: DataAdapterComponent,
};
