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
import type { NoticeListProps } from '../types';

const meta: ComponentMeta< typeof Notice > = {
	title: 'Components/Notice',
	component: Notice,
	subcomponents: { NoticeList },
	parameters: {
		actions: { argTypesRegex: '^on.*' },
		controls: { expanded: true },
		docs: { source: { state: 'open' } },
	},
};
export default meta;

const Template: ComponentStory< typeof Notice > = ( props ) => {
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

export const NoticeListSubcomponent: ComponentStory<
	typeof NoticeList
> = () => {
	const exampleNotices = [
		{
			id: 'second-notice',
			content: 'second notice content',
		},
		{
			id: 'first-notice',
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
