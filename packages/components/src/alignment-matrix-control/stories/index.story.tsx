/**
 * External dependencies
 */
import type { Meta, StoryFn } from '@storybook/react';

/**
 * WordPress dependencies
 */
import { useEffect, useState } from '@wordpress/element';
import { Icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import AlignmentMatrixControl from '..';
import { HStack } from '../../h-stack';
import type { AlignmentMatrixControlProps } from '../types';

const meta: Meta< typeof AlignmentMatrixControl > = {
	title: 'Components (Experimental)/AlignmentMatrixControl',
	component: AlignmentMatrixControl,
	subcomponents: {
		// @ts-expect-error - See https://github.com/storybookjs/storybook/issues/23170
		'AlignmentMatrixControl.Icon': AlignmentMatrixControl.Icon,
	},
	argTypes: {
		onChange: { action: 'onChange', control: { type: null } },
		value: { control: { type: null } },
	},
	parameters: {
		controls: { expanded: true },
		docs: { canvas: { sourceState: 'shown' } },
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

	// Convenience handler for Canvas view so changes are reflected
	useEffect( () => {
		setValue( defaultValue );
	}, [ defaultValue ] );

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
			<Icon
				icon={
					<AlignmentMatrixControl.Icon size={ 24 } value="top left" />
				}
			/>
			<Icon
				icon={
					<AlignmentMatrixControl.Icon
						size={ 24 }
						value="center center"
					/>
				}
			/>
		</HStack>
	);
};
