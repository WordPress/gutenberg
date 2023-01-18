/**
 * External dependencies
 */
import type { ComponentMeta, ComponentStory } from '@storybook/react';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Notice from '..';
import Button from '../../button';
import NoticeList from '../list';
import type { NoticeProps, NoticeListProps } from '../types';

const meta: ComponentMeta< typeof Notice > = {
	title: 'Components/Notice',
	component: Notice,
	subcomponents: { NoticeList },
	argTypes: {
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

export const WithJSXChildren: ComponentStory< typeof Notice > = Template.bind(
	{}
);
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

export const WithActions: ComponentStory< typeof Notice > = Template.bind( {} );
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

export const NoticeListSubcomponent: ComponentStory<
	typeof NoticeList
> = () => {
	const exampleNotices = [
		{
			id: 'second-notice',
			content: 'second notice content',
		},
		{
			id: 'fist-notice',
			content: 'first notice content',
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
			<Button variant={ 'primary' } onClick={ resetNotices }>
				Reset Notices
			</Button>
		</>
	);
};
NoticeListSubcomponent.storyName = 'NoticeList Subcomponent';
