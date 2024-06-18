/**
 * External dependencies
 */
import type { Meta, StoryFn } from '@storybook/react';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import SnackbarList from '../list';

const meta: Meta< typeof SnackbarList > = {
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
		docs: { canvas: { sourceState: 'shown' } },
	},
};
export default meta;

export const Default: StoryFn< typeof SnackbarList > = ( {
	children,
	notices: noticesProp,
	...props
} ) => {
	const [ notices, setNotices ] = useState( noticesProp );

	const onRemove = ( id: string ) => {
		const matchIndex = notices.findIndex( ( n ) => n.id === id );
		if ( matchIndex > -1 ) {
			setNotices( [
				...notices.slice( 0, matchIndex ),
				...notices.slice( matchIndex + 1 ),
			] );
		}
	};

	return (
		<SnackbarList { ...props } notices={ notices } onRemove={ onRemove }>
			{ children }
		</SnackbarList>
	);
};

Default.args = {
	children:
		'Use SnackbarList to communicate multiple low priority, non-interruptive messages to the user.',
	notices: [
		{
			id: 'SAVE_POST_NOTICE_ID_1',
			spokenMessage: 'Post published.',
			actions: [
				{
					label: 'View Post',
					url: 'https://example.com/?p=522',
				},
			],
			content: 'Post published.',
			explicitDismiss: false,
		},
		{
			id: 'SAVE_POST_NOTICE_ID_2',
			spokenMessage: 'Post updated',
			actions: [
				{
					label: 'View Post',
					url: 'https://example.com/?p=522',
				},
			],
			content: 'Post updated.',
			explicitDismiss: false,
		},
		{
			id: 'global1',
			spokenMessage: 'All content copied.',
			actions: [],
			content: 'All content copied.',
			explicitDismiss: false,
		},
	],
};
