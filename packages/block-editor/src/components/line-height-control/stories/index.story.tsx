import type { Meta, StoryFn } from '@storybook/react-vite';
import { useState } from '@wordpress/element';
import LineHeightControl from '../';
import type { LineHeightControlProps } from '../types';

export default {
	component: LineHeightControl,
	id: 'blockeditor-lineheightcontrol',
	title: 'Editor/Block Editor/LineHeightControl',
} satisfies Meta< typeof LineHeightControl >;

const Template: Story = ( props ) => {
	const [ value, setValue ] = useState< string | number >();
	return (
		<LineHeightControl onChange={ setValue } value={ value } { ...props } />
	);
};

type Story = StoryFn< Partial< LineHeightControlProps > >;

export const Default: Story = Template.bind( {} );
Default.args = {
	__unstableInputWidth: '100px',
};

export const UnconstrainedWidth: Story = Template.bind( {} );
UnconstrainedWidth.args = {
	...Default.args,
	__unstableInputWidth: '100%',
};
