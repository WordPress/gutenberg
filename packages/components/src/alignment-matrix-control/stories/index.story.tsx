/**
 * External dependencies
 */
import type { Meta, StoryFn } from '@storybook/react-vite';
import { fn } from 'storybook/test';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { Icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import AlignmentMatrixControl from '..';
import { HStack } from '../../h-stack';
import type { AlignmentMatrixControlProps } from '../types';

const meta: Meta< typeof AlignmentMatrixControl > = {
	title: 'Components/AlignmentMatrixControl',
	component: AlignmentMatrixControl,
	subcomponents: {
		'AlignmentMatrixControl.Icon': AlignmentMatrixControl.Icon,
	},
	argTypes: {
		onChange: { control: false },
		value: { control: false },
	},
	args: {
		onChange: fn(),
	},
	parameters: {
		controls: { expanded: true },
		docs: { canvas: { sourceState: 'shown' } },
		componentStatus: {
			status: 'stable',
			whereUsed: 'editor',
		},
	},
};
export default meta;

const Template: StoryFn< typeof AlignmentMatrixControl > = ( {
	defaultValue,
	onChange,
	...props
} ) => {
	const [ value, setValue ] =
		useState< AlignmentMatrixControlProps[ 'value' ] >();

	return (
		<AlignmentMatrixControl
			{ ...props }
			onChange={ ( ...changeArgs ) => {
				setValue( ...changeArgs );
				onChange?.( ...changeArgs );
			} }
			value={ value }
		/>
	);
};
export const Default = Template.bind( {} );

export const IconSubcomponent = () => {
	return (
		<HStack justify="flex-start">
			<Icon icon={ <AlignmentMatrixControl.Icon value="top left" /> } />
			<Icon
				icon={ <AlignmentMatrixControl.Icon value="center center" /> }
			/>
		</HStack>
	);
};
