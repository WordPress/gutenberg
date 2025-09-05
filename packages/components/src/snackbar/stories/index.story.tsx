/**
 * External dependencies
 */
import type { Meta, StoryFn } from '@storybook/react';

/**
 * WordPress dependencies
 */
import { wordpress } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import Icon from '../../icon';
import Snackbar from '..';

const meta: Meta< typeof Snackbar > = {
	title: 'Components/Feedback/Snackbar',
	id: 'components-snackbar',
	component: Snackbar,
	argTypes: {
		as: { control: false },
		onRemove: {
			action: 'onRemove',
			control: false,
		},
		onDismiss: {
			action: 'onDismiss',
			control: false,
		},
		listRef: {
			control: false,
		},
	},
	parameters: {
		controls: {
			expanded: true,
		},
		docs: { canvas: { sourceState: 'shown' } },
	},
};
export default meta;

const DefaultTemplate: StoryFn< typeof Snackbar > = ( {
	children,
	...props
} ) => {
	return <Snackbar { ...props }>{ children }</Snackbar>;
};

export const Default: StoryFn< typeof Snackbar > = DefaultTemplate.bind( {} );
Default.args = {
	children:
		'Use Snackbars to communicate low priority, non-interruptive messages to the user.',
};

export const WithActions: StoryFn< typeof Snackbar > = DefaultTemplate.bind(
	{}
);
WithActions.args = {
	actions: [
		{
			label: 'Open WP.org',
			url: 'https://wordpress.org',
		},
	],
	children: 'Use Snackbars with an action link to an external page.',
};

export const WithIcon: StoryFn< typeof Snackbar > = DefaultTemplate.bind( {} );
WithIcon.args = {
	children: 'Add an icon to make your snackbar stand out',
	icon: <Icon style={ { fill: 'currentcolor' } } icon={ wordpress } />,
};

export const WithExplicitDismiss: StoryFn< typeof Snackbar > =
	DefaultTemplate.bind( {} );
WithExplicitDismiss.args = {
	children:
		'Add a cross to explicitly close the snackbar, and do not hide it automatically',
	explicitDismiss: true,
};

export const WithActionAndExplicitDismiss: StoryFn< typeof Snackbar > =
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
