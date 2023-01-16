/**
 * External dependencies
 */
import type { ComponentMeta, ComponentStory } from '@storybook/react';

/**
 * Internal dependencies
 */
import Notice from '..';
import type { NoticeProps } from '../types';

// TODO: Add a story involving NoticeList to help people understand
// the difference between onDismiss/onRemove.
const meta: ComponentMeta< typeof Notice > = {
	title: 'Components/Notice',
	component: Notice,
	argTypes: {
		isDismissible: { control: 'boolean' },
		onDismiss: { control: { type: null } },
		onRemove: { control: { type: null } },
		politeness: {
			control: 'radio',
			options: [ 'assertive', 'polite' ],
		},
		spokenMessage: { control: 'text' },
		status: {
			control: 'radio',
			options: [ 'warning', 'success', 'error', 'info' ],
		},
	},
	parameters: {
		controls: { expanded: true },
		docs: { source: { state: 'open' } },
	},
};
export default meta;

const Template = ( props: NoticeProps ) => {
	return <Notice { ...props } />;
};

export const Default: ComponentStory< typeof Notice > = Template.bind( {} );
Default.args = {
	children: 'This is a notice.',
};

export const WithCustomSpokenMessage: ComponentStory< typeof Notice > =
	Template.bind( {} );
WithCustomSpokenMessage.args = {
	...Default.args,
	politeness: 'assertive',
	spokenMessage: 'This is a notice with a custom spoken message',
};
