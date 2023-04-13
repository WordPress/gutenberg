/**
 * External dependencies
 */
import type { ComponentMeta, ComponentStory } from '@storybook/react';

/**
 * Internal dependencies
 */
import Snackbar from '..';

const meta: ComponentMeta< typeof Snackbar > = {
	title: 'Components/Snackbar',
	component: Snackbar,
	argTypes: {
		as: { control: { type: null } },
		onRemove: {
			action: 'onRemove',
			control: { type: null },
		},
		onDismiss: {
			action: 'onDismiss',
			control: { type: null },
		},
		listRef: {
			control: { type: null },
		},
	},
	parameters: {
		controls: {
			expanded: true,
		},
		docs: { source: { state: 'open' } },
	},
};
export default meta;

const DefaultTemplate: ComponentStory< typeof Snackbar > = ( {
	children,
	...props
} ) => {
	return <Snackbar { ...props }>{ children }</Snackbar>;
};

export const Default: ComponentStory< typeof Snackbar > = DefaultTemplate.bind(
	{}
);
Default.args = {
	children:
		'Use Snackbars to communicate low priority, non-interruptive messages to the user.',
};

export const WithActions: ComponentStory< typeof Snackbar > =
	DefaultTemplate.bind( {} );
WithActions.args = {
	actions: [
		{
			label: 'Open WP.org',
			url: 'https://wordpress.org',
		},
	],
	children: 'Use Snackbars with an action link to an external page.',
};

export const WithIcon: ComponentStory< typeof Snackbar > = DefaultTemplate.bind(
	{}
);
WithIcon.args = {
	children: 'Add an icon to make your snackbar stand out',
	icon: (
		<span role="img" aria-label="Icon" style={ { fontSize: 21 } }>
			🌮
		</span>
	),
};

export const WithExplicitDismiss: ComponentStory< typeof Snackbar > =
	DefaultTemplate.bind( {} );
WithExplicitDismiss.args = {
	children:
		'Add a cross to explicitly close the snackbar, and do not hide it automatically',
	explicitDismiss: true,
};

export const WithActionAndExplicitDismiss: ComponentStory< typeof Snackbar > =
	DefaultTemplate.bind( {} );
WithActionAndExplicitDismiss.args = {
	actions: [
		{
			label: 'Open WP.org',
			url: 'https://wordpress.org',
		},
	],
	children:
		'Add an action and a cross to explicitly close the snackbar, and do not hide it automatically',
	explicitDismiss: true,
};
