/**
 * External dependencies
 */
import type { Meta, StoryFn } from '@storybook/react';
import { fn } from '@storybook/test';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { check, external, upload } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import Notice from '..';
import Button from '../../button';
import NoticeList from '../list';
import type { NoticeListProps } from '../types';

const meta: Meta< typeof Notice > = {
	title: 'Components/Feedback/Notice',
	id: 'components-notice',
	component: Notice,
	// @ts-expect-error - See https://github.com/storybookjs/storybook/issues/23170
	subcomponents: { NoticeList },
	args: {
		onDismiss: fn(),
		onRemove: fn(),
	},
	parameters: {
		controls: { expanded: true },
		docs: { canvas: { sourceState: 'shown' } },
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

export const WithIconActions = Template.bind( {} );
WithIconActions.args = {
	...Default.args,
	children: 'This notice has actions with icons.',
	actions: [
		{
			label: 'Upload',
			onClick: () => {},
			icon: upload,
			variant: 'primary',
		},
		{
			label: 'Done',
			onClick: () => {},
			icon: check,
			iconPosition: 'right',
		},
	],
};

export const WithLoadingAction: StoryFn< typeof Notice > = ( props ) => {
	const [ isLoading, setIsLoading ] = useState( false );

	const handleClick = () => {
		setIsLoading( true );
		setTimeout( () => setIsLoading( false ), 2000 );
	};

	return (
		<Notice
			{ ...props }
			actions={ [
				{
					label: isLoading ? 'Saving...' : 'Save',
					onClick: handleClick,
					isBusy: isLoading,
					disabled: isLoading,
					variant: 'primary',
				},
			] }
		>
			Click the button to see the loading state.
		</Notice>
	);
};

export const WithDestructiveAction = Template.bind( {} );
WithDestructiveAction.args = {
	...Default.args,
	status: 'warning',
	children: 'Are you sure you want to delete this item?',
	actions: [
		{
			label: 'Delete',
			onClick: () => {},
			isDestructive: true,
			variant: 'primary',
		},
		{
			label: 'Cancel',
			onClick: () => {},
		},
	],
};

export const WithOpenInNewTab = Template.bind( {} );
WithOpenInNewTab.args = {
	...Default.args,
	children: 'Learn more about this feature.',
	actions: [
		{
			label: 'Documentation',
			url: 'https://wordpress.org',
			target: '_blank',
			rel: 'noreferrer',
			icon: external,
			iconPosition: 'right',
		},
	],
};

export const WithDifferentSizes = Template.bind( {} );
WithDifferentSizes.args = {
	...Default.args,
	children: 'Actions with different sizes.',
	actions: [
		{
			label: 'Small',
			onClick: () => {},
			size: 'small',
		},
		{
			label: 'Compact',
			onClick: () => {},
			size: 'compact',
		},
		{
			label: 'Default',
			onClick: () => {},
			size: 'default',
		},
	],
};

export const WithOnClickAndUrl: StoryFn< typeof Notice > = ( props ) => {
	const [ clickCount, setClickCount ] = useState( 0 );

	return (
		<Notice
			{ ...props }
			actions={ [
				{
					label: 'Visit WordPress.org',
					url: 'https://wordpress.org',
					onClick: () => setClickCount( ( c ) => c + 1 ),
					target: '_blank',
					rel: 'noreferrer',
				},
			] }
		>
			Click count: { clickCount }
		</Notice>
	);
};
