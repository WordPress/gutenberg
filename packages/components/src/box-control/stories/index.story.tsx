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
	title: 'Components (Experimental)/BoxControl',
	component: BoxControl,
	argTypes: {
		values: { control: null },
	},
	parameters: {
		actions: { argTypesRegex: '^on.*' },
		controls: { expanded: true },
		docs: { canvas: { sourceState: 'shown' } },
	},
};
export default meta;

const defaultSideValues = {
	top: '10px',
	right: '10px',
	bottom: '10px',
	left: '10px',
};

const Template: StoryFn< typeof BoxControl > = ( props ) => {
	const [ values, setValues ] =
		useState< ( typeof props )[ 'values' ] >( defaultSideValues );

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

export const Default = Template.bind( {} );
Default.args = {
	values: undefined,
	label: 'Label',
};

export const ArbitrarySides = Template.bind( {} );
ArbitrarySides.args = {
	...Default.args,
	sides: [ 'top', 'bottom' ],
};

export const SingleSide = Template.bind( {} );
SingleSide.args = {
	...Default.args,
	sides: [ 'bottom' ],
};

export const AxialControls = Template.bind( {} );
AxialControls.args = {
	...Default.args,
	splitOnAxis: true,
};

export const AxialControlsWithSingleSide = Template.bind( {} );
AxialControlsWithSingleSide.args = {
	...Default.args,
	sides: [ 'horizontal' ],
	splitOnAxis: true,
};
