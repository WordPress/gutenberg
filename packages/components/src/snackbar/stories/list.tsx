/**
 * External dependencies
 */
import type { ComponentMeta, ComponentStory } from '@storybook/react';

/**
 * Internal dependencies
 */
import SnackbarList from '../list';

const meta: ComponentMeta< typeof SnackbarList > = {
	title: 'Components/SnackbarList',
	component: SnackbarList,
	argTypes: {
		as: { control: { type: null } },
		onRemove: {
			action: 'onRemove',
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

const savePostNotice = {
	id: 'SAVE_POST_NOTICE_ID',
	spokenMessage: 'Post published.',
	actions: [
		{
			label: 'View Post',
			url: 'https://example.com/?p=522',
		},
	],
	content: 'Post published.',
	isDismissible: true,
	explicitDismiss: false,
};

const DefaultTemplate: ComponentStory< typeof SnackbarList > = ( {
	children,
	...props
} ) => {
	return <SnackbarList { ...props }>{ children }</SnackbarList>;
};

export const Default: ComponentStory< typeof SnackbarList > =
	DefaultTemplate.bind( {} );
Default.args = {
	children:
		'Use SnackbarList to communicate multiple low priority, non-interruptive messages to the user.',
	notices: [ savePostNotice ],
};

export const MultipleNotices: ComponentStory< typeof SnackbarList > =
	DefaultTemplate.bind( {} );
MultipleNotices.args = {
	notices: [
		savePostNotice,
		{
			id: 'SAVE_POST_NOTICE_ID',
			spokenMessage: 'Post updated',
			actions: [
				{
					label: 'View Post',
					url: 'https://example.com/?p=522',
				},
			],
			content: 'Post updated.',
			isDismissible: true,
			explicitDismiss: false,
		},
		{
			id: 'global1',
			spokenMessage: 'All content copied.',
			actions: [],
			content: 'All content copied.',
			isDismissible: true,
			explicitDismiss: false,
		},
	],
};
