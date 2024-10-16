/**
 * External dependencies
 */
import type { Meta, StoryFn } from '@storybook/react';
import type { ReactNode } from 'react';

/**
 * WordPress dependencies
 */
import {
	formatBold,
	formatItalic,
	link,
	more,
	wordpress,
} from '@wordpress/icons';

/**
 * Internal dependencies
 */
import './style.css';
import Button from '..';

const meta: Meta< typeof Button > = {
	title: 'Components/Button',
	component: Button,
	argTypes: {
		// Overrides a limitation of the docgen interpreting our TS types for this as required.
		'aria-pressed': {
			control: { type: 'select' },
			description:
				'Indicates the current "pressed" state, implying it is a toggle button. Implicitly set by `isPressed`, but takes precedence if both are provided.',
			options: [ undefined, 'true', 'false', 'mixed' ],
			table: {
				type: {
					summary: 'boolean | "true" | "false" | "mixed"',
				},
			},
		},
		href: { type: { name: 'string', required: false } },
		icon: {
			control: { type: 'select' },
			options: [ 'wordpress', 'link', 'more' ],
			mapping: {
				wordpress,
				link,
				more,
			},
		},
	},
	parameters: {
		controls: { expanded: true },
		docs: { canvas: { sourceState: 'shown' } },
	},
};
export default meta;

const Template: StoryFn< typeof Button > = ( props ) => {
	return <Button { ...props }></Button>;
};

export const Default = Template.bind( {} );
Default.args = {
	children: 'Code is poetry',
};

export const Primary = Template.bind( {} );
Primary.args = {
	...Default.args,
	variant: 'primary',
};

export const Secondary = Template.bind( {} );
Secondary.args = {
	...Default.args,
	variant: 'secondary',
};

export const Tertiary = Template.bind( {} );
Tertiary.args = {
	...Default.args,
	variant: 'tertiary',
};

export const Link = Template.bind( {} );
Link.args = {
	...Default.args,
	variant: 'link',
};

export const IsDestructive = Template.bind( {} );
IsDestructive.args = {
	...Default.args,
	isDestructive: true,
};

export const Icon = Template.bind( {} );
Icon.args = {
	label: 'Code is poetry',
	icon: 'wordpress',
};

export const GroupedIcons = () => {
	const GroupContainer = ( { children }: { children: ReactNode } ) => (
		<div style={ { display: 'inline-flex' } }>{ children }</div>
	);

	return (
		<GroupContainer>
			<Button icon={ formatBold } label="Bold" />
			<Button icon={ formatItalic } label="Italic" />
			<Button icon={ link } label="Link" />
		</GroupContainer>
	);
};
