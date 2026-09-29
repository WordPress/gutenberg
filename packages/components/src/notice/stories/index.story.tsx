import type { Meta, StoryFn } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { useState } from '@wordpress/element';
import Notice from '..';
import Button from '../../button';
import NoticeList from '../list';
import type { NoticeListProps } from '../types';

const meta: Meta< typeof Notice > = {
	tags: [ 'manifest' ],
	title: 'Components/Feedback/Notice',
	id: 'components-notice',
	component: Notice,
	subcomponents: { NoticeList },
	args: {
		onDismiss: fn(),
		onRemove: fn(),
	},
	parameters: {
		controls: { expanded: true },
		docs: { canvas: { sourceState: 'shown' } },
		componentStatus: {
			status: 'recommended',
			whereUsed: 'global',
			notes: 'Will be superseded by [`Notice`](?path=/docs/design-system-components-notice--docs) in `@wordpress/ui`, but continue using for now.',
		},
	},
};
export default meta;

const Template: StoryFn< typeof Notice > = ( props ) => {
	return <Notice { ...props } />;
};

export const Default = Template.bind( {} );
Default.args = {
	children: 'This is a notice.',
};

export const WithCustomSpokenMessage = Template.bind( {} );
WithCustomSpokenMessage.args = {
	...Default.args,
	politeness: 'assertive',
	spokenMessage: 'This is a notice with a custom spoken message',
};

export const WithJSXChildren = Template.bind( {} );
WithJSXChildren.args = {
	...Default.args,
	children: (
		<>
			<p>
				JSX elements can be helpful
				<strong> if you need to format</strong> the notice output.
			</p>
			<code>
				note: in the interest of consistency, this should not be
				overused!
			</code>
		</>
	),
};

export const WithActions = Template.bind( {} );
WithActions.args = {
	...Default.args,
	actions: [
		{
			label: 'Click me!',
			onClick: () => {},
			variant: 'primary',
		},
		{
			label: 'Or click me instead!',
			onClick: () => {},
		},
		{
			label: 'Or visit a link for more info',
			url: 'https://wordpress.org',
			variant: 'link',
		},
	],
};

export const NoticeListSubcomponent: StoryFn< typeof NoticeList > = () => {
	const exampleNotices: NoticeListProps[ 'notices' ] = [
		{
			id: 'second-notice',
			content: 'second notice content',
		},
		{
			id: 'first-notice',
			content: 'first notice content',
			actions: [
				{
					label: 'Click me!',
					onClick: () => {},
					variant: 'primary',
				},
				{
					label: 'Or click me instead!',
					onClick: () => {},
				},
				{
					label: 'Or visit a link for more info',
					url: 'https://wordpress.org',
					variant: 'link',
				},
			],
		},
	];
	const [ notices, setNotices ] = useState( exampleNotices );

	const removeNotice = (
		id: NoticeListProps[ 'notices' ][ number ][ 'id' ]
	) => {
		setNotices( notices.filter( ( notice ) => notice.id !== id ) );
	};

	const resetNotices = () => {
		setNotices( exampleNotices );
	};

	return (
		<>
			<NoticeList notices={ notices } onRemove={ removeNotice } />
			<Button
				__next40pxDefaultSize
				variant="primary"
				onClick={ resetNotices }
			>
				Reset Notices
			</Button>
		</>
	);
};
NoticeListSubcomponent.storyName = 'NoticeList Subcomponent';

/**
 * A `detail` holds a fuller account of what went wrong — the server's own
 * report of a failure, say — behind a disclosure, and offers it for copying
 * together with the message. Keep the message readable on its own: the detail
 * is for the account a developer or an assistant needs.
 */
export const WithDetail = Template.bind( {} );
WithDetail.args = {
	...Default.args,
	status: 'error',
	children: 'Updating failed. Please try updating again.',
	detail: 'The title field was rejected by a server-side rule.\nRemove “Break save” from the title, then try again.',
};

/**
 * Action buttons can be disabled.
 */
export const WithDisabledAction = Template.bind( {} );
WithDisabledAction.args = {
	...Default.args,
	children: 'This notice has a disabled action.',
	actions: [
		{
			label: 'Disabled action',
			onClick: () => {},
			disabled: true,
		},
		{
			label: 'Enabled action',
			onClick: () => {},
		},
	],
};
