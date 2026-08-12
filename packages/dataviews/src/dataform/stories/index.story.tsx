import { expect, userEvent, waitFor, within } from 'storybook/test';
import DataForm from '../index';
import LayoutCardComponent from './layout-card';
import LayoutDetailsComponent from './layout-details';
import LayoutMixedComponent from './layout-mixed';
import LayoutRegularComponent from './layout-regular';
import LayoutRowComponent from './layout-row';
import LayoutPanelComponent from './layout-panel';
import DataAdapterComponent from './data-adapter';
import ValidationComponent from './validation';
import ValidationPanelComponent from './validation-panel';
import VisibilityComponent from './visibility';

const meta = {
	tags: [ 'manifest' ],
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
		editVisibility: {
			control: { type: 'select' },
			description: 'Chooses when the edit icon is visible.',
			options: [ 'default', 'always', 'on-hover' ],
		},
		applyLabel: {
			control: { type: 'text' },
			description:
				'Custom text for the modal apply button. Defaults to "Apply".',
			if: { arg: 'openAs', eq: 'modal' },
		},
		cancelLabel: {
			control: { type: 'text' },
			description:
				'Custom text for the modal cancel button. Defaults to "Cancel".',
			if: { arg: 'openAs', eq: 'modal' },
		},
	},
	args: {
		openAs: 'default',
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
		disabled: {
			control: { type: 'boolean' },
			description: 'Disable all fields in the form.',
		},
	},
	args: {
		disabled: false,
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

/**
 * In the `panel` layout, a field's error indicator overlays the edit button's
 * stretched hit area, so it relays its clicks to the button. The interaction
 * test covers what jsdom cannot: the real stacking and focus behavior.
 */
export const ValidationPanelErrorIndicator = {
	render: ValidationPanelComponent,
	play: async ( { canvasElement }: { canvasElement: HTMLElement } ) => {
		const canvas = within( canvasElement );
		// The flyout renders in a portal outside the story canvas.
		const body = within( canvasElement.ownerDocument.body );

		// Make the field invalid: clear the required value, then dismiss the
		// flyout. The row only reveals the error after its flyout has been
		// open once.
		await userEvent.click(
			canvas.getByRole( 'button', { name: 'Edit Title' } )
		);
		await userEvent.clear( await body.findByRole( 'textbox' ) );
		await userEvent.keyboard( '{Escape}' );

		const editButton = await canvas.findByRole( 'button', {
			name: 'Edit Title (has errors)',
		} );

		// The error indicator wraps the label, stacking above the edit
		// button's stretched hit area, so it delegates clicks to it.
		await userEvent.click( canvas.getByText( 'Title' ) );
		await expect( await body.findByRole( 'textbox' ) ).toBeVisible();
		await expect( editButton ).toHaveAttribute( 'aria-expanded', 'true' );

		// Dismissing the flyout returns focus to the edit button, as if it
		// had been clicked directly.
		await userEvent.keyboard( '{Escape}' );
		await waitFor( () => expect( editButton ).toHaveFocus() );
	},
};

export const Visibility = {
	render: VisibilityComponent,
};

export const DataAdapter = {
	render: DataAdapterComponent,
};
