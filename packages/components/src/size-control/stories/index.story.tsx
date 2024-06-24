/**
 * External dependencies
 */
import type { Meta, StoryFn } from '@storybook/react';
import { action } from '@storybook/addon-actions';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import SizeControl from '..';
import type { SizeControlProps } from '../types';

const meta: Meta< typeof SizeControl > = {
	title: 'Components (Experimental)/SizeControl',
	tags: [ 'status-private' ],
	component: SizeControl,
	argTypes: {
		value: { control: { type: null } },
	},
	parameters: {
		actions: { argTypesRegex: '^on.*' },
		controls: { expanded: true },
		docs: { canvas: { sourceState: 'shown' } },
	},
};

export default meta;

const Template: StoryFn< typeof SizeControl > = ( args: SizeControlProps ) => {
	const [ value, setValue ] = useState( args.value );

	return (
		<SizeControl
			{ ...args }
			value={ value }
			onChange={ ( val ) => {
				// If it's resetting, use the fallbackValue
				const newValue = val ?? '16px';
				setValue( newValue );
				action( 'onChange' )( newValue );
			} }
		/>
	);
};

export const Default = Template.bind( {} );
Default.args = {
	value: '16px',
	size: 'default',
	units: [ 'px', 'em', 'rem', 'vw', 'vh' ],
	label: 'Size Control Label',
};

export const Disabled = Template.bind( {} );
Disabled.args = {
	value: '16px',
	size: 'default',
	units: [ 'px', 'em', 'rem', 'vw', 'vh' ],
	label: 'Size Control Label',
	disabled: true,
};

export const WithReset = Template.bind( {} );
WithReset.args = {
	value: '16px',
	withReset: true,
	size: 'default',
	units: [ 'px', 'em', 'rem', 'vw', 'vh' ],
	label: 'Size Control Label',
};

export const WithoutSlider = Template.bind( {} );
WithoutSlider.args = {
	value: '16px',
	withSlider: false,
	size: 'default',
	units: [ 'px', 'em', 'rem', 'vw', 'vh' ],
	label: 'Size Control Label',
};

export const CustomUnits = Template.bind( {} );
CustomUnits.args = {
	value: '16%',
	size: 'default',
	units: [ '%', 'em' ],
	label: 'Size Control Label',
};
