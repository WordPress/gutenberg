import type { Meta, StoryFn } from '@storybook/react-vite';
import { useState } from '@wordpress/element';
import DimensionControl from '../';
import type { DimensionControlProps } from '../types';

export default {
	component: DimensionControl,
	id: 'blockeditor-dimensioncontrol',
	title: 'Editor/Block Editor/DimensionControl',
} satisfies Meta< typeof DimensionControl >;

type Story = StoryFn< Partial< DimensionControlProps > >;

const Template: Story = ( props ) => {
	const [ value, setValue ] = useState< string >();
	return (
		<DimensionControl onChange={ setValue } value={ value } { ...props } />
	);
};

export const Default: Story = Template.bind( {} );

export const WithCustomLabel: Story = Template.bind( {} );
WithCustomLabel.args = {
	label: 'Height',
};

export const WithWidthLabel: Story = Template.bind( {} );
WithWidthLabel.args = {
	label: 'Width',
};

export const WithMinHeightLabel: Story = Template.bind( {} );
WithMinHeightLabel.args = {
	label: 'Minimum height',
};

export const WithPresets: Story = Template.bind( {} );
WithPresets.args = {
	label: 'Height with presets',
};

export const WithInitialValue: Story = Template.bind( {} );
WithInitialValue.args = {
	label: 'Height',
	value: '24px',
};

const TemplateWithPresetValue: Story = ( props ) => {
	const [ value, setValue ] = useState< string | undefined >(
		'var:preset|dimension|medium'
	);
	return (
		<DimensionControl onChange={ setValue } value={ value } { ...props } />
	);
};

export const WithPresetValue: Story = TemplateWithPresetValue.bind( {} );
WithPresetValue.args = {
	label: 'Height (preset value)',
};
