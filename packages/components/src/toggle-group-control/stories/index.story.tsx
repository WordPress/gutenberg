/**
 * External dependencies
 */
import type { Meta, StoryFn } from '@storybook/react';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { formatLowercase, formatUppercase } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import {
	ToggleGroupControl,
	ToggleGroupControlOption,
	ToggleGroupControlOptionIcon,
} from '../index';
import type {
	ToggleGroupControlOptionProps,
	ToggleGroupControlOptionIconProps,
	ToggleGroupControlProps,
} from '../types';

const meta: Meta< typeof ToggleGroupControl > = {
	component: ToggleGroupControl,
	// @ts-expect-error - See https://github.com/storybookjs/storybook/issues/23170
	subcomponents: { ToggleGroupControlOption, ToggleGroupControlOptionIcon },
	title: 'Components (Experimental)/ToggleGroupControl',
	argTypes: {
		help: { control: { type: 'text' } },
		onChange: { action: 'onChange' },
		value: { control: { type: null } },
	},
	parameters: {
		controls: { expanded: true },
		docs: { canvas: { sourceState: 'shown' } },
	},
};
export default meta;

const Template: StoryFn< typeof ToggleGroupControl > = ( {
	onChange,
	...props
} ) => {
	const [ value, setValue ] =
		useState< ToggleGroupControlProps[ 'value' ] >();

	return (
		<ToggleGroupControl
			__nextHasNoMarginBottom
			{ ...props }
			onChange={ ( ...changeArgs ) => {
				setValue( ...changeArgs );
				onChange?.( ...changeArgs );
			} }
			value={ value }
		/>
	);
};

const mapPropsToOptionComponent = ( {
	value,
	...props
}: ToggleGroupControlOptionProps ) => (
	<ToggleGroupControlOption value={ value } key={ value } { ...props } />
);

const mapPropsToOptionIconComponent = ( {
	value,
	...props
}: ToggleGroupControlOptionIconProps ) => (
	<ToggleGroupControlOptionIcon value={ value } key={ value } { ...props } />
);

export const Default: StoryFn< typeof ToggleGroupControl > = Template.bind(
	{}
);
Default.args = {
	children: [
		{ value: 'left', label: 'Left' },
		{ value: 'center', label: 'Center' },
		{ value: 'right', label: 'Right' },
		{ value: 'justify', label: 'Justify' },
	].map( mapPropsToOptionComponent ),
	isBlock: true,
	label: 'Label',
};

/**
 * A tooltip can be shown for each option by enabling the `showTooltip` prop.
 * The `aria-label` will be used in the tooltip if provided. Otherwise, the
 * `label` will be used.
 */
export const WithTooltip: StoryFn< typeof ToggleGroupControl > = Template.bind(
	{}
);
WithTooltip.args = {
	...Default.args,
	children: [
		{
			value: 'asc',
			label: 'A→Z',
			'aria-label': 'Ascending',
			showTooltip: true,
		},
		{
			value: 'desc',
			label: 'Z→A',
			'aria-label': 'Descending',
			showTooltip: true,
		},
	].map( mapPropsToOptionComponent ),
};

/**
 * The `ToggleGroupControlOptionIcon` component can be used for icon options. A `label` is required
 * on each option for accessibility, which will be shown in a tooltip.
 */
export const WithIcons: StoryFn< typeof ToggleGroupControl > = Template.bind(
	{}
);
WithIcons.args = {
	...Default.args,
	children: [
		{ value: 'uppercase', label: 'Uppercase', icon: formatUppercase },
		{ value: 'lowercase', label: 'Lowercase', icon: formatLowercase },
	].map( mapPropsToOptionIconComponent ),
	isBlock: false,
};

/**
 * When the `isDeselectable` prop is true, the option can be deselected by clicking on it again.
 */
export const Deselectable: StoryFn< typeof ToggleGroupControl > = Template.bind(
	{}
);
Deselectable.args = {
	...WithIcons.args,
	isDeselectable: true,
};
