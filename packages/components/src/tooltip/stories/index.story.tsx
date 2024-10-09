/**
 * External dependencies
 */
import type { Meta, StoryFn } from '@storybook/react';

/**
 * WordPress dependencies
 */
import { shortcutAriaLabel } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import Tooltip from '..';
import Button from '../../button';

const meta: Meta< typeof Tooltip > = {
	title: 'Components/Tooltip',
	component: Tooltip,
	argTypes: {
		children: { control: { type: null } },
		position: {
			control: { type: 'select' },
			options: [
				'top left',
				'top center',
				'top right',
				'bottom left',
				'bottom center',
				'bottom right',
			],
		},
		shortcut: { control: { type: 'object' } },
	},
	parameters: {
		controls: { expanded: true },
		docs: { canvas: { sourceState: 'shown' } },
	},
	decorators: [
		( Story ) => {
			return (
				<>
					{ /* eslint-disable-next-line no-restricted-syntax */ }
					<p id="test-description">Button description</p>
					<Story />
				</>
			);
		},
	],
};
export default meta;

const Template: StoryFn< typeof Tooltip > = ( props ) => (
	<Tooltip { ...props } />
);

export const Default: StoryFn< typeof Tooltip > = Template.bind( {} );
Default.args = {
	children: <Button variant="primary">Tooltip Anchor</Button>,
	text: 'Tooltip Text',
};

export const KeyboardShortcut = Template.bind( {} );
KeyboardShortcut.args = {
	children: <Button variant="secondary">Keyboard Shortcut</Button>,
	shortcut: {
		display: '⇧⌘,',
		ariaLabel: shortcutAriaLabel.primaryShift( ',' ),
	},
};

/**
 * In case one or more `Tooltip` components are rendered inside another
 * `Tooltip` component, only the tooltip associated to the outermost `Tooltip`
 * component will be rendered in the browser and shown to the user
 * appropriately. The rest of the nested `Tooltip` components will simply no-op
 * and pass-through their anchor.
 */
export const Nested: StoryFn< typeof Tooltip > = Template.bind( {} );
Nested.args = {
	children: (
		<Tooltip text="Nested tooltip text (that will never show)">
			<Button variant="primary">Tooltip Anchor</Button>
		</Tooltip>
	),
	text: 'Outer tooltip text',
};

export const AlreadyWithDescription: StoryFn< typeof Tooltip > = Template.bind(
	{}
);
AlreadyWithDescription.args = {
	children: (
		<button aria-describedby="test-description">Tooltip Anchor</button>
	),
	text: 'Tooltip Text',
};

export const SameLabel: StoryFn< typeof Tooltip > = Template.bind( {} );
SameLabel.args = {
	children: <button aria-label="Button label">Tooltip Anchor</button>,
	text: 'Button label',
};
