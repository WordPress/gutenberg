/**
 * External dependencies
 */
import type { ComponentMeta, ComponentStory } from '@storybook/react';

/**
 * Internal dependencies
 */
import Dropdown from '..';
import Button from '../../button';
import { DropdownContentWrapper } from '../dropdown-content-wrapper';

const meta: ComponentMeta< typeof Dropdown > = {
	title: 'Components/Dropdown',
	component: Dropdown,
	subcomponents: { DropdownContentWrapper },
	argTypes: {
		focusOnMount: {
			options: [ 'firstElement', true, false ],
			control: {
				type: 'radio',
			},
		},
		position: { control: { type: null } },
		renderContent: { control: { type: null } },
		renderToggle: { control: { type: null } },
	},
	parameters: {
		controls: {
			expanded: true,
		},
	},
};
export default meta;

const Template: ComponentStory< typeof Dropdown > = ( args ) => {
	return (
		<div style={ { height: 150 } }>
			<Dropdown { ...args } />
		</div>
	);
};

export const Default: ComponentStory< typeof Dropdown > = Template.bind( {} );
Default.args = {
	renderToggle: ( { isOpen, onToggle } ) => (
		<Button onClick={ onToggle } aria-expanded={ isOpen } variant="primary">
			Open dropdown
		</Button>
	),
	renderContent: () => <div>This is the dropdown content.</div>,
};

/**
 * To apply more padding to the dropdown content, use the provided `<DropdownContentWrapper>`
 * convenience wrapper. A `paddingSize` of `"medium"` is suitable for relatively larger dropdowns (default is `"small"`).
 */
export const WithMorePadding: ComponentStory< typeof Dropdown > = Template.bind(
	{}
);
WithMorePadding.args = {
	...Default.args,
	renderContent: () => (
		<DropdownContentWrapper paddingSize="medium">
			Content wrapped with <code>{ `paddingSize="medium"` }</code>.
		</DropdownContentWrapper>
	),
};

/**
 * The `<DropdownContentWrapper>` convenience wrapper can also be used to remove padding entirely,
 * with a `paddingSize` of `"none"`. This can also serve as a clean foundation to add arbitrary
 * paddings, for example when child components already have padding on their own.
 */
export const WithNoPadding: ComponentStory< typeof Dropdown > = Template.bind(
	{}
);
WithNoPadding.args = {
	...Default.args,
	renderContent: () => (
		<DropdownContentWrapper paddingSize="none">
			Content wrapped with <code>{ `paddingSize="none"` }</code>.
		</DropdownContentWrapper>
	),
};
