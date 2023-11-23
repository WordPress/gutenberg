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
import type { BoxControlValue } from '../types';

const meta: Meta< typeof BoxControl > = {
	title: 'Components (Experimental)/BoxControl',
	component: BoxControl,
	argTypes: {
		onChange: { action: 'onChange' },
	},
	parameters: {
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
		useState< BoxControlValue >( defaultSideValues );

	return (
		<BoxControl
			label="Padding"
			values={ values }
			{ ...props }
			onChange={ ( nextValue ) => setValues( nextValue ) }
		/>
	);
};

export const Default = Template.bind( {} );
Default.args = {
	label: 'Box Control',
	values: undefined,
};

export const ArbitrarySides = Template.bind( {} );
ArbitrarySides.args = {
	sides: [ 'top', 'bottom' ],
};

export const SingleSide = Template.bind( {} );
SingleSide.args = {
	sides: [ 'bottom' ],
};

export const AxialControls = Template.bind( {} );
AxialControls.args = {
	splitOnAxis: true,
};

export const AxialControlsWithSingleSide = Template.bind( {} );
AxialControlsWithSingleSide.args = {
	sides: [ 'horizontal' ],
	splitOnAxis: true,
};
