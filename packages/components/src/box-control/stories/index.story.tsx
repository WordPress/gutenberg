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
import BoxControl from '../';

const meta: Meta< typeof BoxControl > = {
	title: 'Components/BoxControl',
	component: BoxControl,
	argTypes: {
		values: { control: false },
	},
	parameters: {
		actions: { argTypesRegex: '^on.*' },
		controls: { expanded: true },
		docs: { canvas: { sourceState: 'shown' } },
	},
};
export default meta;

const TemplateUncontrolled: StoryFn< typeof BoxControl > = ( props ) => {
	return <BoxControl { ...props } />;
};

const TemplateControlled: StoryFn< typeof BoxControl > = ( props ) => {
	const [ values, setValues ] = useState< ( typeof props )[ 'values' ] >();

	return (
		<BoxControl
			values={ values }
			{ ...props }
			onChange={ ( nextValue ) => {
				setValues( nextValue );
				props.onChange?.( nextValue );
			} }
		/>
	);
};

export const Default = TemplateUncontrolled.bind( {} );
Default.args = {
	label: 'Label',
	__next40pxDefaultSize: true,
};

export const Controlled = TemplateControlled.bind( {} );
Controlled.args = {
	...Default.args,
};

export const ArbitrarySides = TemplateControlled.bind( {} );
ArbitrarySides.args = {
	...Default.args,
	sides: [ 'top', 'bottom' ],
};

export const SingleSide = TemplateControlled.bind( {} );
SingleSide.args = {
	...Default.args,
	sides: [ 'bottom' ],
};

export const AxialControls = TemplateControlled.bind( {} );
AxialControls.args = {
	...Default.args,
	splitOnAxis: true,
};

export const AxialControlsWithSingleSide = TemplateControlled.bind( {} );
AxialControlsWithSingleSide.args = {
	...Default.args,
	sides: [ 'horizontal' ],
	splitOnAxis: true,
};

export const ControlWithPresets = TemplateControlled.bind( {} );
ControlWithPresets.args = {
	...Default.args,
	presets: [
		{ name: 'Small', slug: 'small', value: '4px' },
		{ name: 'Medium', slug: 'medium', value: '8px' },
		{ name: 'Large', slug: 'large', value: '12px' },
		{ name: 'Extra Large', slug: 'extra-large', value: '16px' },
	],
	presetKey: 'padding',
};
